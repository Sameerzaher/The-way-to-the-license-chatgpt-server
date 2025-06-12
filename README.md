# Chat GPT Server

A Node.js Express server for chat functionality with OpenAI integration.

## Features

- Chat endpoints
- Questions and answers management
- Practice sessions
- User management
- OpenAI integration

## Local Development

1. Navigate to the server directory:
   ```bash
   cd chat-gpt-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Connect your GitHub repository to Render
2. The `render.yaml` file will automatically configure your deployment
3. Set your environment variables in the Render dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key

### Option 2: Manual Setup

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `cd chat-gpt-server && npm install`
   - **Start Command**: `cd chat-gpt-server && npm start`
   - **Environment**: Node
   - **Region**: Oregon (or your preferred region)
   - **Plan**: Free (or your preferred plan)

4. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NODE_ENV`: production

## API Endpoints

- `GET /health` - Health check endpoint
- `/chat` - Chat related endpoints
- `/questions` - Question management
- `/answers` - Answer management
- `/practice` - Practice session endpoints
- `/user` - User management

## Environment Variables

- `OPENAI_API_KEY` - Required: Your OpenAI API key
- `PORT` - Optional: Server port (defaults to 3000)
- `NODE_ENV` - Optional: Environment (production/development) 