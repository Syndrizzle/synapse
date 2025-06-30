# <img src="https://github.com/user-attachments/assets/758d36e7-3520-419a-a9f2-04addb9b948b" width="300">
### Generate accurate multiple-choice questions from any PDF with Synapse. Enhance comprehension and accelerate your learning 🪄
![GitHub License](https://img.shields.io/github/license/syndrizzle/synapse?style=for-the-badge&color=facc15&labelColor=262626&logo=gnu&logoColor=facc15)
![Website](https://img.shields.io/website?url=https://synapse.drzl.dev&style=for-the-badge&color=facc15&labelColor=262626&up_message=online&down_message=offline&logo=react&logoColor=facc15&link=https://synapse.drzl.dev)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/syndrizzle/synapse/main.yml?style=for-the-badge&color=facc15&labelColor=262626&logo=githubactions&logoColor=facc15)
![Runs On Coolify](https://img.shields.io/badge/runs%20on%20coolify-8455f6?style=for-the-badge&link=https://github.com/Syndrizzle/synapse/blob/main/docker-compose.coolify.yml&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02NC4yNSAxNjBIMTI3Ljc1TDEyOCAxNjAuMjVWMTkySDE1OS43NUwxNjAgMTkyLjI1VjM1MkgzODMuNzVMMzg0IDM1Mi4yNVYzODRINDE1Ljc1TDQxNiAzODQuMjVWNDQ3Ljc1TDQxNC43NSA0NDhIMTYwLjI1TDE2MCA0NDcuNzVWNDE2SDEyOC4yNUwxMjggNDE1Ljc1VjM4NEg5Ni4yNUw5NiAzODMuNzVWMzUySDY0LjI1TDY0IDM1MS43NVYxNjAuMjVMNjQuMjUgMTYwWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyOC4yNSA5NkgzODMuNzVMMzg0IDk2LjI1VjEyOEg0MTUuNzVMNDE2IDEyOC4yNVYxOTEuNzVMNDE0Ljc1IDE5MkgxNjAuMjVMMTYwIDE5MS43NVYxNjBIMTI4LjI1TDEyOCAxNTkuNzVWOTYuMjVMMTI4LjI1IDk2WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTM4NC4yNSAzODRINDE1Ljc1TDQxNiAzODQuMjVWNDQ3Ljc1TDQxNC43NSA0NDhIMTYwLjI1TDE2MCA0NDcuNzVWNDE2LjI1TDM4NCA0MTZWNDA4Ljc1TDM4NC4yNSAzODRaIiBmaWxsPSIjRDRENEQ0Ii8+CjxwYXRoIGQ9Ik0zODQuMjUgMTI4SDQxNS43NUw0MTYgMTI4LjI1VjE5MS43NUw0MTQuNzUgMTkySDE2MC4yNUwxNjAgMTkxLjc1VjE2MC4yNUwzODQgMTYwVjE1Mi43NUwzODQuMjUgMTI4WiIgZmlsbD0iI0Q0RDRENCIvPgo8cGF0aCBkPSJNMTI4LjI1IDE5MkgxNTkuNzVMMTYwIDE5Mi4yNVYzNTEuNzVMMTU4LjI1IDM1MkwxMzEuMjUgMzUxLjc1TDEyOC4yNSAzNTEuNVYxOTJaIiBmaWxsPSIjRDRENEQ0Ii8+CjxwYXRoIGQ9Ik0xMTkuNSAzNTJIMTI3LjVMMTI3Ljc1IDM1Mi4yNVYzODRIOTYuMjVMOTYgMzgzLjc1VjM1Mi4yNUwxMTkuNSAzNTJaIiBmaWxsPSIjRDRENEQ0Ii8+Cjwvc3ZnPgo=)

## ✨ Features
- Uses [openrouter](https://openrouter.ai/), which offers a really wide range of models, and a plethora of API features.
- Beautiful, fast frontend with a slick user experience, powered by [Vite](https://vite.dev/) and [TailwindCSS](https://tailwindcss.com/)
- Built in Quiz result to PDF generation powered by [React PDF](https://react-pdf.org/).
- Robust backend powered by [ExpressJS](https://expressjs.com/), offering a lot of configuration
- Database powered by [KeyDB](https://docs.keydb.dev/) to offer quick retrieval of data.

## ⚙️ Run It  
`1.` Clone the repository: `git clone https://github.com/Syndrizzle/synapse.git`  
`2.` Install the dependencies, I recommend using [`pnpm`](https://pnpm.io/): 1. Frontend: `cd client; pnpm install`; 2. Backend: `cd ../server; pnpm install`  
`3.` Build the frontend: `cd ../client; pnpm build`  
`4.` `⚠️ IMPORTANT` The express server serves the static files from `/` when you start the server (Later in this process). Copy the `dist` folder which gets generated after the frontend builds. And move it to `server/`. Rename it to `static`. Without this the frontend won't run along with the server.  
`5.` Rename [`.env.example`](https://github.com/Syndrizzle/synapse/blob/main/.env.example) to `.env` and fill in your values. You usually just change the `OPENROUTER_API_KEY` and `REDIS_URL` as they are a must for it to work.  

> [!IMPORTANT]  
> The Openrouter Key, and the Redis URL is important. Without them, all of this is useless. While you may think openrouter is a paid service, they provide you with a `<$1` allowance, thus if you use a cheap model such as [Gemini 2.0 Flash](https://openrouter.ai/google/gemini-2.0-flash-001), you can easily generate more than 500 quizzes with a free account. Although I have never tested it, I can't say if the `<$1` allowance lasts. For redis, you can try [Redis Cloud](https://redis.io/try-free/)

`6.` Run the server: `node server/index.js`  
`7.` If everything goes as planned, the server won't hiccup, and you can visit `localhost:3000` to check it out. If you do not see it, check if there's something wrong in the logs.

## 🚀 Deploy
- As stated above, this proudly runs on [Coolify](https://coolify.io/). I do not support or endorse vercel.
- There is a [`docker-compose.coolify.yml`](https://github.com/Syndrizzle/synapse/blob/main/docker-compose.coolify.yml) file, use that.
- Open your coolify instance, when creating a new project select `Empty Docker Compose` and paste it there.
- Optionally configure your desired environment values from [`.env.example`](https://github.com/Syndrizzle/synapse/blob/main/.env.example), and the Domain.
- Press deploy to deploy it using docker, the image is hosted on [GitHub Container Repository](https://github.com/Syndrizzle/synapse/pkgs/container/synapse)
- For those who do not want to use coolify, a standard barebones [`docker-compose.yml`](https://github.com/Syndrizzle/synapse/blob/main/docker-compose.yml) is also provided.

### Happy Exploring 🤠
