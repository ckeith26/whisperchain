# WhisperChain+ Client

Frontend for the WhisperChain+ secure anonymous messaging platform with role-based access control.

## Features

- Secure, anonymous messaging
- Role-based access control (Sender, Recipient, Moderator, Admin)
- Message flagging functionality
- User profile management
- Key pair generation for secure communication

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with:
   ```
   VITE_API_URL=http://localhost:9090/api
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Build

To build for production:
```
npm run build
```

## Project Structure

- `/src` - Application source code
  - `/components` - React components
    - `/auth` - Authentication utilities
    - `/sign-in` - Login components
    - `/sign-up` - Registration components
    - `/chat` - Messaging interface
    - `/profile` - User profile management
    - `/shared-components` - Reusable UI components
  - `/store` - Zustand state management
  - `index.jsx` - Application entry point
  - `styles.scss` - Global styles

## Technologies Used

- React (v18)
- Material UI
- Zustand (State Management)
- Vite (Build Tool)
- Axios (API Requests)
- React Router (v6)
- SASS (Styling)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter

## API Integration

The frontend communicates with the WhisperChain+ API at the URL specified in the `.env` file. The API provides endpoints for:

- User authentication
- Message sending/receiving
- User search
- Key pair generation

## Security Features

- JWT-based authentication
- Role-based access control
- Client-side validation
- Secure message transmission 