# Octogle Meet - WebRTC Video Conferencing Application

A real-time peer-to-peer video conferencing application built with React and Node.js, enabling seamless video calls between two participants using WebRTC technology.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [How to Use](#how-to-use)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Real-time Video/Audio Communication**: High-quality peer-to-peer video and audio calls
- **Room-based System**: Create or join rooms using unique room IDs
- **Automatic Reconnection**: Robust reconnection logic for network interruptions
- **Media Controls**: Toggle microphone and camera on/off during calls
- **Connection Status**: Real-time connection status indicators
- **Responsive UI**: Modern and clean user interface
- **No External Dependencies**: Direct peer-to-peer connection (P2P) using WebRTC

## Architecture

### System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client 1  │◄───────►│   Signaling  │◄───────►│  Client 2   │
│  (Browser)  │         │    Server    │         │  (Browser)  │
│             │         │  (Socket.io) │         │             │
└──────┬──────┘         └──────────────┘         └──────┬──────┘
       │                                                 │
       │              WebRTC P2P Connection             │
       └─────────────────────────────────────────────────┘
```

### Components

1. **Client Application (React)**
   - Frontend UI for creating/joining rooms
   - Modular architecture with custom hooks:
     - `useMediaStream` - Camera/microphone access and controls
     - `useSocketConnection` - Socket.io connection and reconnection
     - `usePeerConnection` - WebRTC peer connection management
     - `useRoomConnection` - Orchestrates all connection logic
   - Utility modules for configuration and error handling

2. **Signaling Server (Node.js/Express)**
   - Manages room creation and joining
   - Facilitates WebRTC signaling (offer/answer/ICE candidates)
   - Handles socket connections and disconnections
   - Room state management

3. **WebRTC Peer Connection**
   - Direct peer-to-peer media streaming
   - ICE candidate exchange for NAT traversal
   - Automatic reconnection on connection loss

### Data Flow

1. **Room Creation/Joining**
   - Client 1 creates a room → Server creates room entry
   - Client 2 joins room → Server notifies Client 1
   - Both clients establish WebRTC connection

2. **WebRTC Signaling**
   - Client 2 creates offer → Sends to server → Server forwards to Client 1
   - Client 1 creates answer → Sends to server → Server forwards to Client 2
   - Both exchange ICE candidates through server
   - Direct P2P connection established

3. **Media Streaming**
   - Once connected, media streams directly between peers
   - Server is no longer involved in media transmission

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (v6 or higher) - Comes with Node.js
- **Modern Web Browser** with WebRTC support:
  - Chrome/Edge (recommended)
  - Firefox
  - Safari
- **Camera and Microphone** access permissions

## Installation

Follow these steps to set up the project on your local system:

### Step 1: Clone the Repository

Open your terminal (Command Prompt, PowerShell, or Terminal) and run:

```bash
git clone git@github.com:13nidhi/octogle-meet.git
cd octo-react
```


### Step 2: Install Server Dependencies

Navigate to the server directory and install Node.js packages:

```bash
cd server
npm install
```

This will install all required dependencies for the signaling server (Express, Socket.io, CORS).

**Expected output**: You should see a `node_modules` folder created in the `server` directory.

### Step 3: Install Client Dependencies

Navigate to the client directory and install React dependencies:

```bash
cd ../client
npm install
```

This will install all required dependencies for the React frontend (React, React Router, Socket.io Client, etc.).

**Expected output**: You should see a `node_modules` folder created in the `client` directory.

### Verification

After installation, your project structure should look like this:

```
octo-react/
├── client/
│   ├── node_modules/     ✅ Should exist after installation
│   └── package.json
├── server/
│   ├── node_modules/     ✅ Should exist after installation
│   └── package.json
└── README.md
```

If you encounter any errors during installation:
- Ensure Node.js and npm are properly installed
- Check your internet connection
- Try deleting `node_modules` folders and `package-lock.json` files, then run `npm install` again

## Running Locally

The application requires two separate processes to run: the signaling server and the React client. You need to run them in **two separate terminal windows**.

### Step 1: Start the Signaling Server

**Open your first terminal window** and run:

```bash
cd server
npm start
```

**What to expect:**
- The server will start on `http://localhost:4000`
- You should see: `Signaling server listening on 4000`
- **Keep this terminal window open** - the server must stay running

**If you see an error:**
- Make sure port 4000 is not already in use
- Check that you've installed dependencies (`npm install` in the server folder)

### Step 2: Start the Client Application

**Open a second terminal window** (keep the server terminal running) and run:

```bash
cd client
npm start
```

**What to expect:**
- The React app will compile and start
- Your browser should automatically open to `http://localhost:3000`
- If it doesn't open automatically, manually navigate to `http://localhost:3000`
- You should see the home page with "Create Room" and "Join Room" options

**If you see an error:**
- Make sure the server is running first (Step 1)
- Check that you've installed dependencies (`npm install` in the client folder)
- Ensure port 3000 is not already in use

### Step 3: Verify Both Are Running

You should now have:
- ✅ **Terminal 1**: Server running on port 4000
- ✅ **Terminal 2**: Client running on port 3000
- ✅ **Browser**: Application open at `http://localhost:3000`

**Important**: Both terminals must remain open while using the application. Closing either terminal will stop that part of the application.

## How to Use

This section explains how to use the application once it's running.

### Overview

Octogle Meet is a **1-on-1 video conferencing application**. It allows two people to have a video call by:
1. One person creates a room and gets a unique Room ID
2. The second person joins using that Room ID
3. Both participants can see and hear each other in real-time

### Step-by-Step Usage Guide

#### For the Room Creator (First Participant)

1. **Open the Application**
   - Navigate to `http://localhost:3000` in your browser
   - You'll see the home page with two options

2. **Create a Room**
   - Click the **"Create Room"** button
   - A new room will be created with a unique Room ID
   - You'll be redirected to the room page

3. **Share the Room ID**
   - On the room page, you'll see your **Room ID** displayed prominently
   - **Copy this Room ID** and share it with the person you want to call
   - You can share it via:
     - Text message
     - Email
     - Chat application
     - Or any other method

4. **Wait for Participant**
   - You'll see a message indicating you're waiting for someone to join
   - Your local video (your own camera) should be visible
   - Once someone joins, the video call will automatically start

5. **During the Call**
   - You'll see:
     - **Your video** (local video) - usually smaller, in a corner
     - **Remote video** (other person's video) - larger, main view
     - **Connection status** indicator showing the connection quality
   - Use the control buttons to:
     - **Toggle microphone** (mute/unmute)
     - **Toggle camera** (turn video on/off)
     - **Leave room** (end the call)

#### For the Room Joiner (Second Participant)

1. **Open the Application**
   - Navigate to `http://localhost:3000` in your browser
   - You can use the same browser or a different one
   - **Tip**: For testing on the same computer, use an incognito/private window or a different browser

2. **Join a Room**
   - On the home page, you'll see an input field for Room ID
   - **Paste the Room ID** you received from the room creator
   - Click the **"Join Room"** button

3. **Grant Permissions**
   - Your browser will ask for permission to access your **camera and microphone**
   - Click **"Allow"** or **"Yes"** to grant permissions
   - This is required for the video call to work

4. **Start the Call**
   - Once you join, the video call will automatically start
   - You should see:
     - **Your video** (local video)
     - **Remote video** (the other person's video)
   - The connection will be established automatically

5. **During the Call**
   - Use the same controls as the creator:
     - Toggle microphone
     - Toggle camera
     - Leave room

### User Interface Elements

#### Home Page
- **Create Room Button**: Creates a new room and generates a unique Room ID
- **Join Room Section**: 
  - Input field for Room ID
  - Join Room button

#### Room Page (During Call)
- **Room ID Display**: Shows the current room ID (for sharing)
- **Local Video**: Your own camera feed (usually smaller)
- **Remote Video**: Other participant's camera feed (main view)
- **Connection Status**: Indicator showing:
  - 🟢 Connected (green) - Good connection
  - 🟡 Connecting (yellow) - Establishing connection
  - 🔴 Disconnected (red) - Connection lost
- **Control Buttons**:
  - 🎤 **Microphone Toggle**: Mute/unmute your microphone
  - 📹 **Camera Toggle**: Turn your camera on/off
  - 🚪 **Leave Room**: End the call and return to home page

### Testing on the Same Computer

** Incognito/Private Mode**
- Open one window in normal mode
- Open another window in incognito/private mode
- Both can access `http://localhost:3000`


### Tips for Best Experience

1. **Browser Compatibility**: Chrome or Edge work best. Firefox and Safari also supported.
2. **Network**: Both participants should have a stable internet connection
3. **Permissions**: Always allow camera and microphone access when prompted
4. **Firewall**: If connection fails, check if firewall is blocking WebRTC
5. **HTTPS in Production**: For production deployment, HTTPS is required for media access

### Ending a Call

- Click the **"Leave Room"** button
- You'll be redirected back to the home page
- The other participant will see that you've left
- You can create or join a new room anytime

## Project Structure

```
octo-react/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   │   └── Controls.jsx
│   │   ├── hooks/         # Custom React hooks
│   │   │   ├── useMediaStream.js      # Media stream management
│   │   │   ├── useSocketConnection.js # Socket.io connection logic
│   │   │   ├── usePeerConnection.js   # WebRTC peer connection
│   │   │   └── useRoomConnection.js   # Room connection orchestration
│   │   ├── pages/         # Page components
│   │   │   ├── Home.jsx   # Landing page
│   │   │   └── Room.jsx   # Video call room
│   │   ├── utils/         # Utility functions
│   │   │   ├── socketConfig.js    # Server configuration
│   │   │   └── errorMessages.js  # Error message formatting
│   │   ├── App.jsx        # Main app component
│   │   ├── index.js       # Entry point
│   │   └── styles.css     # Global styles
│   ├── package.json
│   └── README.md
│
├── server/                # Node.js signaling server
│   ├── server.js          # Main server file
│   └── package.json
│
└── README.md              # This file
```

##  Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Socket.io Client** - Real-time signaling
- **WebRTC API** - Peer-to-peer communication
- **Tailwind CSS** - Styling
- **UUID** - Room ID generation

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - WebSocket server for signaling
- **CORS** - Cross-origin resource sharing

## How It Works

### Architecture Overview

The application uses a modular hook-based architecture:
- **`useMediaStream`**: Handles camera/microphone access and media controls
- **`useSocketConnection`**: Manages Socket.io connection, room joining, and signaling
- **`usePeerConnection`**: Handles WebRTC peer connection, offer/answer, and ICE candidates
- **`useRoomConnection`**: Orchestrates all hooks to provide a unified connection interface

This separation of concerns makes the codebase maintainable, testable, and easier to understand.

### WebRTC Connection Process

1. **Media Access**: Browser requests camera/microphone access via `useMediaStream`
2. **Room Setup**: Client connects to signaling server via `useSocketConnection` and creates/joins room
3. **Peer Discovery**: Server notifies when peer joins
4. **Offer/Answer Exchange**: 
   - Joiner creates WebRTC offer via `usePeerConnection`
   - Creator receives offer and creates answer
   - Both exchange session descriptions via signaling server
5. **ICE Candidate Exchange**: Both peers exchange network information for NAT traversal
6. **Direct Connection**: Once ICE candidates are exchanged, direct P2P connection is established
7. **Media Streaming**: Video/audio streams directly between peers

### Reconnection Logic

The application includes robust reconnection mechanisms implemented in `useSocketConnection` and `usePeerConnection`:

- **Socket Reconnection**: Automatic reconnection to signaling server with exponential backoff (max 5 attempts)
- **Peer Reconnection**: Automatic peer connection re-establishment on failure
- **State Management**: Tracks connection state and retry attempts across all hooks
- **User Feedback**: Visual indicators for reconnection status and retry count
- **Room Rejoin**: Automatically rejoins room after socket reconnection

## 🔧 Troubleshooting

### Common Issues

#### 1. Camera/Microphone Not Working
- **Solution**: Check browser permissions in settings
- Ensure HTTPS in production (required for media access)
- Try a different browser

#### 2. Connection Failed
- **Check**: Both server and client are running
- **Verify**: Server URL in `client/src/utils/socketConfig.js` matches your server
- **Test**: Open browser console for error messages

#### 3. Cannot See Remote Video
- **Check**: Both peers have granted camera permissions
- **Verify**: WebRTC connection is established (check status indicator)
- **Try**: Refresh both browser windows

#### 4. Socket Connection Issues
- **Check**: Server is running and accessible
- **Verify**: CORS is properly configured
- **Test**: Check network tab in browser DevTools

#### 5. ICE Connection Failed
- **Cause**: NAT/firewall blocking WebRTC
- **Solution**: Configure TURN server for production (not included in this basic setup)
- **Workaround**: Try from different network or disable firewall temporarily

### Debug Mode

Enable detailed logging by opening browser console (F12) to see:
- Socket connection events
- WebRTC connection state changes
- ICE candidate exchange
- Error messages

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Built with ❤️ using React and WebRTC**

