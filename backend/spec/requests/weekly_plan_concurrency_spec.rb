require "rails_helper"

RSpec.describe "Concurrent weekly plan saves", type: :request do
  self.use_transactional_tests = false

  before do
    @user = create(:user)
    create(:profile, user: @user, weekly_availability: Profile::WEEKDAYS.index_with { 30 }, race_date: Date.current + 100)
    plans = (Date.current..Date.current + 6).map do |date|
      { "date" => date.to_s, "training_type" => "easy_run", "description" => "20分のラン", "duration_minutes" => 20,
        "distance_km" => 3, "pace" => nil, "notes" => "" }
    end
    ai = instance_double(ChatgptService, generate_training_records: { "training_records" => plans })
    allow(ChatgptService).to receive(:new).and_return(ai)
  end

  after { @user.destroy! if @user&.persisted? }

  def save_concurrently(tokens)
    ready = Queue.new
    start = Queue.new
    threads = tokens.map do |token|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          runner = User.find(@user.id)
          ready << true
          start.pop
          begin
            WeeklyPlanService.new(runner).commit(token)
            :saved
          rescue WeeklyPlanService::Error => error
            error.status
          end
        end
      end
    end
    tokens.length.times { ready.pop }
    tokens.length.times { start << true }
    threads.map(&:value)
  end

  it "applies a repeated request only once even when both requests arrive together" do
    token = WeeklyPlanService.new(@user).propose[:proposal_token]
    expect(save_concurrently([ token, token ])).to eq([ :saved, :saved ])
    expect(@user.training_records.count).to eq(7)
    expect(TrainingPlanCommit.where(user: @user).count).to eq(1)
  end

  it "does not let two different proposals overwrite each other concurrently" do
    tokens = Array.new(2) { WeeklyPlanService.new(@user).propose[:proposal_token] }
    expect(save_concurrently(tokens)).to contain_exactly(:saved, :conflict)
    expect(@user.training_records.count).to eq(7)
    expect(TrainingPlanCommit.where(user: @user).count).to eq(1)
  end
end
