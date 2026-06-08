# Contributing to SOC Companion

First off, thank you for considering contributing to SOC Companion! It's people like you that make SOC Companion such a great tool for the infosec community.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](../../issues) to see if someone else has already created a ticket. If not, go ahead and make one!

## Setting up your development environment

To get started, you'll need Node.js, npm, and the Supabase CLI installed.

1. **Fork & Clone** the repository to your local machine.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the local Supabase stack**:
   If you want to run the database locally instead of using a cloud project:
   ```bash
   supabase start
   ```
4. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```
   Fill it with your local or remote Supabase keys.
5. **Run the local dev server**:
   ```bash
   npm run dev
   ```

## Creating a Pull Request

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (if applicable).
5. Make sure your code lints.
6. Issue that pull request!

## Code Style

- We use **Prettier** for formatting.
- We use **ESLint** for linting.
- Run `npm run lint` before committing your code to ensure it meets our quality standards.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
