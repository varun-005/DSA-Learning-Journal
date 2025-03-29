# PostPro

A simple social media application where users can create posts and interact with others.

## Features

- User authentication with JWT
- Create, edit and delete posts
- Like/Unlike posts
- Profile picture management
- Responsive UI with TailwindCSS

## Setup

1. Install dependencies

```bash
npm install
```

2. Create uploads directory for profile pictures

```bash
mkdir -p public/images/uploads
```

3. Add default profile picture

```bash
node scripts/createDefaultImage.js
```

4. Start MongoDB server

5. Run the application

```bash
npm run dev
```

## Tech Stack

- Node.js & Express
- MongoDB with Mongoose
- EJS templates
- TailwindCSS
- JWT for authentication
- Multer for file uploads
