# <img src="https://github.com/user-attachments/assets/758d36e7-3520-419a-a9f2-04addb9b948b" width="300">
### Generate accurate multiple-choice questions from any PDF with Synapse. Enhance comprehension and accelerate your learning 🪄
![GitHub License](https://img.shields.io/github/license/syndrizzle/synapse?style=for-the-badge&color=facc15&labelColor=262626&logo=gnu&logoColor=facc15)
![Website](https://img.shields.io/website?url=https://synapse.drzl.dev&style=for-the-badge&color=facc15&labelColor=262626&up_message=online&down_message=offline&logo=react&logoColor=facc15&link=https://synapse.drzl.dev)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/syndrizzle/synapse/main.yml?style=for-the-badge&color=facc15&labelColor=262626&logo=githubactions&logoColor=facc15)

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
- You can deploy this on coolify for now. I will work on making it serverless so it can be easier to deploy it on vercel.
- There is a [`docker-compose.coolify.yml`](https://github.com/Syndrizzle/synapse/blob/main/docker-compose.coolify.yml) file, use that.
- Open your coolify instance, when creating a new project select `Empty Docker Compose` and paste it there.
- Optionally configure your desired environment values from [`.env.example`](https://github.com/Syndrizzle/synapse/blob/main/.env.example), and the Domain.
- Press deploy to deploy it using docker, the image is hosted on [GitHub Container Repository](https://github.com/Syndrizzle/synapse/pkgs/container/synapse)
- For those who do not want to use coolify, a standard barebones [`docker-compose.yml`](https://github.com/Syndrizzle/synapse/blob/main/docker-compose.yml) is also provided.

### Happy Exploring 🤠
