require 'rails_helper'

RSpec.describe 'Health Controller', type: :request do
  describe 'GET /health' do
    it 'return 200 OK' do
      get '/health'

      expect(response).to have_http_status(:ok)
    end
  end
end