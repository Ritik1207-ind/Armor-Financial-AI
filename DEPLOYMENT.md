# 🚀 Deploying & Sharing Armor (Financial Conversation Intelligence System)

This comprehensive guide details the step-by-step process of adding this project to your team's GitHub and deploying it to production.

---

## 📁 Project Structure Recap
The project is organized as a monorepo containing three core services:
1. `client/` - React + Tailwind CSS (Vite)
2. `server/` - Express.js Orchestrator (Node.js)
3. `ai-service/` - NLP, STT & Entity Extraction API (FastAPI)

---

## 🐙 Step 1: Push to Your Team's GitHub & Add Collaborators

Since the project was cloned from the original organization repository, you will want to host it under your own profile or a new organization and invite your teammates.

### 1. Create a New Repository on GitHub
1. Go to [GitHub](https://github.com/) and click **New** (or go to `github.com/new`).
2. Name your repository (e.g., `Armor-Financial-AI`).
3. Set the visibility to **Public** or **Private**.
4. **Do not** initialize the repository with a README, `.gitignore`, or license (since these are already in your project).

### 2. Point Your Local Code to the New Remote
Open a terminal in the root of the project (`Elite-Barbarians/`) and run:
```bash
# 1. Remove the current organization remote
git remote remove origin

# 2. Add your new GitHub repository as the remote origin
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git

# 3. Rename current branch to main (if not already)
git branch -M main

# 4. Push the code to your new repository
git push -u origin main
```

### 3. Add Your Teammates as Collaborators
1. Navigate to your new repository on GitHub.
2. Click on the ⚙️ **Settings** tab.
3. Select **Collaborators** from the left sidebar.
4. Click the green **Add people** button.
5. Search by your teammates' GitHub usernames or email addresses, and click **Add [Username] to this repository**.
6. Your teammates will receive an email/notification to accept the invitation. Once accepted, they can push/pull directly.

---

## 🍃 Step 2: Set Up MongoDB Atlas (Cloud Database)

The Node.js server needs a cloud database to store transcripts, user data, and extracted financial entities.

1. Sign up/log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** to deploy a new cluster. Choose the **M0 Shared (Free)** tier.
3. Select a cloud provider (e.g., AWS) and region nearest to you.
4. **Security Quickstart**:
   - Create a database user (e.g., username: `armor_user`, password: `your_secure_password`). Keep these safe!
   - Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`). This is necessary because serverless hosting providers (like Render or Railway) use dynamic IPs.
5. Once the cluster is ready, click **Connect** -> **Drivers** -> Copy the connection string. It will look like this:
   `mongodb+srv://armor_user:<db_password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
6. Replace `<db_password>` with your actual database user's password. Save this string for later.

---

## 🤖 Step 3: Deploy the AI Service (Python FastAPI)

The AI service handles Speech-to-Text (STT) and topic-matching models. Because it uses Python libraries like `torch` and `transformers`, it can be resource-heavy. 

### Option A: Render (Web Service) — Recommended for Simplicity
1. Sign up/log in to [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `armor-ai-service`
   - **Root Directory**: `ai-service`
   - **Runtime**: `Python 3` (Render supports Python natively)
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** and add the following Environment Variables:
   - `GROQ_API_KEY`: *(your API key)*
   - `GEMINI_API_KEY`: *(your API key)*
   - `DEEPGRAM_API_KEY`: *(your API key)*
   - `OPENAI_API_KEY`: *(your API key)*
   - `HF_API_TOKEN`: *(your HF API token)*
   - `STT_PROVIDER`: `auto` (or `groq` / `deepgram` depending on your preference)
   - `PORT`: `10000` (Render sets this dynamically, but it's good practice)
6. Click **Deploy Web Service**. Render will build and expose a public URL (e.g., `https://armor-ai-service.onrender.com`). Copy this URL.

> [!WARNING]
> Python packages like `torch` and `transformers` might exceed Render's free tier build/memory limits. If the build crashes due to memory issues, you can deploy using a lightweight Docker container or migrate to a service with more memory like Railway (free credits) or Hugging Face Spaces (Docker Space).

---

## 🖥️ Step 4: Deploy the Express Server (Node.js)

The Express server orchestrates user requests and forwards audio to the AI service.

1. In [Render](https://render.com/), click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following:
   - **Name**: `armor-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
4. Add the following Environment Variables in the **Environment** section:
   - `MONGO_URI`: *(your MongoDB Atlas Connection String from Step 2)*
   - `AI_SERVICE_URL`: *(the deployed URL of your AI Service from Step 3, e.g., `https://armor-ai-service.onrender.com`)*
   - `PORT`: `5000` (Render will override/handle this, but keeping it helps configuration)
   - `GROQ_API_KEY`, `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`: *(add if server accesses them directly)*
5. Deploy the service and copy the public backend URL (e.g., `https://armor-backend.onrender.com`).

---

## 🎨 Step 5: Deploy the React Client (Vite)

Deploy the frontend dashboard to **Vercel** or **Netlify** for super-fast global delivery.

### Option A: Vercel (Recommended)
1. Go to [Vercel](https://vercel.com/) and sign in with your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your `Armor-Financial-AI` repository.
4. In the configuration window:
   - **Framework Preset**: Choose **Vite**.
   - **Root Directory**: Click *Edit* and select the `client` folder.
   - **Build & Development Settings**: Keep defaults (Build command: `npm run build`, Output directory: `dist`).
5. Open the **Environment Variables** section and add:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api` (the Node.js backend URL + `/api`)
6. Click **Deploy**. Vercel will build your static files and give you a production link (e.g., `https://armor-financial-ai.vercel.app`).

---

## 🧪 Step 6: Testing & Verification

Once all three parts are deployed:
1. Open the Vercel Frontend URL in your browser.
2. Try importing/recording a sample conversation.
3. Verify that requests successfully go to the Express server (database gets populated) and that the AI service performs intent detection and returns correct structured insights.
