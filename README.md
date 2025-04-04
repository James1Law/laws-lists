# Laws Lists

A secure and user-friendly list management application built with Next.js, TypeScript, and Supabase. Create password-protected groups and manage lists within them.

## Features

- Create password-protected groups
- Manage multiple lists within each group
- Add, edit, and delete list items
- Mark items as complete
- Modern, responsive UI with Shadcn components
- Secure authentication using bcrypt
- Data persistence with Supabase

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI
- Supabase
- Bcrypt for password hashing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## License

MIT
