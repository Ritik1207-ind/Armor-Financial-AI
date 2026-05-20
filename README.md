

# 🛡️ Armor – Financial Conversation Intelligence System

## 🚀 Overview

Armor is an **AI-powered multilingual financial conversation intelligence system** that captures informal financial discussions and converts them into structured, actionable insights.

It enables users to:

* Track financial decisions made in conversations
* Avoid missed commitments
* Improve long-term financial planning

---

## 🎯 Problem Statement

In real life, financial decisions are often discussed informally in **multilingual and code-mixed conversations** (e.g., Hinglish, Tamil-English).

These discussions:

* Are not recorded
* Get forgotten over time
* Lead to emotional or inconsistent decisions

Existing finance tools rely on manual input and fail to capture real-world intent.

---

## 💡 Solution

Armor solves this by:

* Capturing conversations (audio input)
* Converting speech → text
* Detecting financial intent
* Extracting key financial entities
* Generating structured summaries
* Storing insights for future reference

---

## ⚙️ System Architecture

```
Audio Input
   ↓
Speech-to-Text (Whisper / Indic ASR)
   ↓
Language Detection
   ↓
Financial Conversation Detection
   ↓
Entity Extraction (NER)
   ↓
LLM Insight Generator
   ↓
Structured JSON Output
   ↓
Database Storage
   ↓
User Interface (Dashboard)
```

---

## 🧩 Features

### ✅ Core Features

* 🎤 Audio capture of conversations
* 🌐 Multilingual & code-mixed speech support
* 🧠 Financial conversation detection
* 💰 Entity extraction (amount, EMI, loan, etc.)
* 📄 Structured financial summaries
* 🗂️ Conversation history tracking
* ✏️ Editable transcripts

### 🚀 Advanced Features

* ⚠️ Risk classification (Safe / Risky / Uncertain)
* 📊 Timeline of financial decisions
* 🔔 Smart reminders (future scope)
* 😊 Emotion detection (future scope)

---

## 🧠 Tech Stack

### Backend

* Python (FastAPI / Flask)
* Whisper / Indic ASR
* HuggingFace Transformers
* spaCy (NER)
* LLM APIs (Groq / Gemini / OpenAI)

### Frontend

* React.js
* Tailwind CSS

### Database

* MongoDB (JSON-based storage)

---

## 📤 Sample Input & Output

### 🎙️ Input

> “Let’s take a loan of 5 lakh, EMI manage ho jayega”

### 📄 Output

```json
{
  "decision": "Take loan",
  "amount": 500000,
  "type": "loan",
  "risk": "medium",
  "confidence": 0.9
}
```

---

## 🔐 Privacy & Security

* 🔒 Data encryption for stored conversations
* 🧑 Masking sensitive information (names, amounts)
* 🚫 Minimal storage of raw audio
* 🔑 Secure API handling

---

## 📊 Evaluation Criteria Alignment

| Criteria               | Implementation         |
| ---------------------- | ---------------------- |
| Working Prototype      | End-to-end pipeline    |
| Transcription Accuracy | Multilingual STT       |
| Insight Extraction     | Structured JSON output |
| UI                     | Editable dashboard     |
| Code Quality           | Modular architecture   |

---

## ⚠️ Constraints Handled

* Multilingual + code-mixed speech
* Privacy preservation
* No dependency on manual input
* Scalable architecture

---

## 🧪 Test Cases

### Financial

* “EMI manage ho jayega”
* “SIP badha dete hain next month”

### Non-Financial

* “Movie dekhne chalte hain”
* “Risk lene ka maza hi alag hai”

### Ambiguous

* “5 lakh daal dete hain kya?”

---

## 🌟 Key Innovation

* Converts **informal conversations → structured financial memory**
* Handles **real-world multilingual inputs**
* Tracks **financial decisions over time**

---

## 🏁 Future Improvements

* Real-time conversation detection
* Financial risk scoring system
* Smart notifications & reminders
* Visualization dashboard

---

## 🎤 One-Line Pitch

**Armor transforms real-world financial conversations into structured, trackable, and intelligent insights.**

---

## 👨‍💻 Contributors

* Sachin Kumar
* Siddhant Kumar
* Ritik Sinha
* Mohit

---

If you want next level 🔥, I can:

* Add **badges + GitHub styling**
* Create **setup/installation steps**
* Write **API documentation section**
* Or make a **killer demo script**