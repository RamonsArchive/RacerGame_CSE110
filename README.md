This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Overview

**Type Quest** is an educational racing game platform featuring multiple interactive games designed to improve typing skills, grammar, and word recognition. The platform supports both single-player and multiplayer modes with real-time synchronization.

## Code Goals

### Primary Objectives

1. **Educational Gaming Platform**
   - Provide engaging, grade-level appropriate educational games
   - Support multiple game types: typing races, grammar correction, word unscrambling
   - Implement adaptive difficulty based on grade levels (K, 1-2, 3-4, 5-6)

2. **Multiplayer Experience**
   - Real-time multiplayer gameplay with synchronized game state
   - Lobby system for player discovery and matchmaking
   - Live progress tracking and leaderboard updates

3. **Performance & Scalability**
   - Server-side rendering for optimal performance
   - Efficient state management with Redis for multiplayer coordination
   - Rate limiting and security measures for API endpoints

4. **Code Quality & Maintainability**
   - Type-safe codebase with TypeScript
   - Consistent code style with ESLint and Prettier
   - Comprehensive testing coverage
   - Clear separation of concerns and modular architecture

5. **User Experience**
   - Responsive design with modern UI/UX
   - Smooth animations and visual feedback
   - Accessible and intuitive game interfaces
   - Real-time progress indicators and game state visualization

### Technical Goals

- **Type Safety**: Full TypeScript coverage with strict type checking
- **Performance**: Optimized builds with Next.js and Turbopack
- **Reliability**: Robust error handling and validation
- **Security**: Rate limiting, input validation, and secure API design
- **Maintainability**: Clean code structure, comprehensive documentation, and consistent patterns

## Code Structure

```
my-project/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (pages)/                  # Route groups
│   │   │   ├── typequest/            # Main game: Type Quest
│   │   │   │   └── page.tsx          # Game controller & state management
│   │   │   ├── treasurehunt/        # Mini game: Treasure Hunt
│   │   │   │   └── page.tsx          # Grammar correction game
│   │   │   └── unscramble/          # Mini game: Unscramble
│   │   │       └── page.tsx          # Word unscrambling game
│   │   │
│   │   ├── api/                      # API Routes (Server-side)
│   │   │   ├── game/                 # Game room management
│   │   │   │   ├── route.ts          # Create/fetch game rooms
│   │   │   │   └── progress/        # Game progress tracking
│   │   │   │       └── route.ts      # Player progress updates
│   │   │   ├── lobby/                # Multiplayer lobby
│   │   │   │   └── route.ts         # Join/leave lobby, player discovery
│   │   │   ├── match/                # Match management
│   │   │   │   └── route.ts         # Match requests & acceptance
│   │   │   └── leaderboard/         # Leaderboard system
│   │   │       └── route.ts          # Score tracking & rankings
│   │   │
│   │   ├── components/              # React Components
│   │   │   ├── GameCard.tsx          # Home page game cards
│   │   │   ├── BackTo.tsx            # Navigation component
│   │   │   ├── MultiplayerSetup.tsx  # Multiplayer configuration
│   │   │   │
│   │   │   ├── TQ_*.tsx              # Type Quest components
│   │   │   │   ├── TQ_SetupScreen.tsx      # Game setup & grade selection
│   │   │   │   ├── TQ_ActiveScreen.tsx     # Active gameplay screen
│   │   │   │   ├── TQ_FinishedScreen.tsx   # Game completion screen
│   │   │   │   ├── TQ_Summary.tsx          # Game results summary
│   │   │   │   ├── TQ_Leaderboard.tsx      # Leaderboard display
│   │   │   │   ├── TQ_RematchButton.tsx    # Rematch functionality
│   │   │   │   └── TQ_RematchAcceptToast.tsx # Rematch notifications
│   │   │   │
│   │   │   ├── TH_*.tsx              # Treasure Hunt components
│   │   │   │   ├── TH_SetupScreen.tsx
│   │   │   │   ├── TH_ActiveScreen.tsx
│   │   │   │   └── TH_FinishedScreen.tsx
│   │   │   │
│   │   │   └── UN_*.tsx              # Unscramble components
│   │   │       ├── UN_SetupScreen.tsx
│   │   │       ├── UN_ActiveScreen.tsx
│   │   │       └── UN_FinishedScreen.tsx
│   │   │
│   │   ├── constants/                # Game data & configuration
│   │   │   ├── index_home.tsx        # Home page game list
│   │   │   ├── index_typequest.tsx   # Type Quest questions & config
│   │   │   ├── index_treasurehunt.tsx # Treasure Hunt questions
│   │   │   └── index_unscramble.tsx  # Unscramble word lists
│   │   │
│   │   ├── fonts/                    # Custom fonts (Nunito family)
│   │   ├── globals.css               # Global styles & theme
│   │   ├── layout.tsx                # Root layout component
│   │   ├── page.tsx                  # Home page
│   │   └── loading.tsx                # Loading UI
│   │
│   ├── lib/                          # Shared utilities & types
│   │   ├── GlobalTypes.ts            # TypeScript type definitions
│   │   ├── redis.ts                  # Redis client configuration
│   │   ├── rateLimiter.ts            # API rate limiting
│   │   ├── utils_typequest.ts        # Type Quest game logic
│   │   ├── utils_treasurehunt.ts    # Treasure Hunt game logic
│   │   └── utils_unscramble.ts      # Unscramble game logic
│   │
│   └── test/                         # Test utilities
│       └── setup.ts                  # Test configuration
│
├── .github/                          # GitHub configuration
│   ├── workflows/
│   │   └── ci.yml                    # CI/CD pipeline
│   └── CODEOWNERS                    # Code ownership rules
│
├── public/                           # Static assets
│   └── Assets/                       # Game images & resources
│
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
└── README.md                         # This file
```

### Key Directories Explained

- **`app/(pages)/`**: Game pages using Next.js route groups. Each game has its own page with state management.
- **`app/api/`**: Server-side API routes for multiplayer functionality, game state, and leaderboards.
- **`app/components/`**: Reusable React components organized by game (TQ*, TH*, UN\_ prefixes).
- **`app/constants/`**: Game data, questions, and configuration files.
- **`lib/`**: Shared utilities, type definitions, and business logic.
- **`.github/`**: CI/CD workflows and code ownership rules.

### Architecture Patterns

- **Server Components**: Home page and static content use Next.js server components for better performance
- **Client Components**: Game pages use client-side state management for interactivity
- **API Routes**: RESTful API design for multiplayer coordination via Redis
- **Type Safety**: Comprehensive TypeScript types in `GlobalTypes.ts` and throughout the codebase
- **Separation of Concerns**: Game logic separated into utility files, components handle UI only

## Development

```bash
npm run dev

# or

yarn dev

# or

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
npm run build

npm start
```

### Code Quality

```bash
# Lint code (shows success message if no issues)
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting (used in CI)
npm run format:check

# Type check with TypeScript (tsc = TypeScript Compiler)
# Checks for type errors without building
npm run type-check

# Run all checks at once (lint + format + type-check)
npm run check
```

**What is `tsc`?**

- `tsc` = TypeScript Compiler
- `tsc --noEmit` = Check types without generating JavaScript files
- Catches type errors, missing imports, wrong types before runtime
- **Always run this before pushing** to catch missing dependencies like `lucide-react`

### Unit Testing

```bash
# Run tests in watch mode (interactive)
npm run test

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests once (used in CI)
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

**Testing Framework:**

- **Vitest**: Fast unit testing framework powered by Vite
- Tests are located alongside source files with `.test.ts` or `.test.tsx` extensions
- Uses `@testing-library/react` for component testing
- Test setup configuration in `src/test/setup.ts`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Start for Contributors

1. Create a feature branch: `git checkout -b feature/your-feature`

2. Make your changes

3. Run quality checks: `npm run lint && npm run format:check && npm run build`

4. Commit and push: `git push origin feature/your-feature`

5. Create a Pull Request on GitHub

6. Wait for review and approval before merging

### Branch Protection

- All merge requests require at least one review (different people can review the code)

- All CI checks must pass (lint, format, type-check, tests, build)

- No direct pushes to `main` branch

- See [BRANCH_PROTECTION.md](./.github/BRANCH_PROTECTION.md) for setup details

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
