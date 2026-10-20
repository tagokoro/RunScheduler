require "spec_helper"
require "fileutils"
require "open3"
require "tmpdir"

RSpec.describe "Docker Rails startup" do
  let(:entrypoint) { File.expand_path("../../bin/docker-entrypoint", __dir__) }

  around do |example|
    Dir.mktmpdir("runplan-startup") do |directory|
      @directory = directory
      FileUtils.mkdir_p(File.join(directory, "bin"))
      File.write(File.join(directory, "bin/rails"), <<~SH)
        #!/bin/sh
        printf '%s\\n' "$*" >> "$STARTUP_TRACE"
        if [ "$1" = "db:prepare" ]; then exit "${PREPARE_EXIT:-0}"; fi
      SH
      FileUtils.chmod(0o755, File.join(directory, "bin/rails"))
      example.run
    end
  end

  def invoke(*arguments, prepare_exit: "0")
    trace = File.join(@directory, "trace")
    _, _, status = Open3.capture3(
      { "STARTUP_TRACE" => trace, "PREPARE_EXIT" => prepare_exit },
      entrypoint, *arguments, chdir: @directory
    )
    [ status, File.exist?(trace) ? File.readlines(trace, chomp: true) : [] ]
  end

  it "prepares the database before passing all server arguments to Rails" do
    status, calls = invoke("./bin/rails", "server", "-b", "0.0.0.0", "-p", "32100")
    expect(status).to be_success
    expect(calls).to eq([ "db:prepare", "server -b 0.0.0.0 -p 32100" ])
  end

  it "does not start Rails when database preparation fails" do
    status, calls = invoke("./bin/rails", "server", prepare_exit: "42")
    expect(status.exitstatus).to eq(42)
    expect(calls).to eq([ "db:prepare" ])
  end

  it "does not prepare the database for administrative commands" do
    status, calls = invoke("./bin/rails", "runner", "puts(1)")
    expect(status).to be_success
    expect(calls).to eq([ "runner puts(1)" ])
  end
end
