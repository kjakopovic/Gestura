# Gestura

<div align="center">
  <img src="https://via.placeholder.com/150?text=Gestura" alt="Gestura Logo" width="150"/>
  <p><strong>Learn, Communicate, and Connect through Sign Language</strong></p>
</div>

## 📱 Overview

Gestura is a comprehensive platform that makes Sign Language accessible to everyone. Through interactive lessons, real-time translation, and a gamified learning experience, users can learn Sign Language efficiently while enjoying their progress.

The core functionality enables real-time sign language communication:

- A user signs words using ASL, letter by letter
- Our ML model processes each letter in real-time
- Recipients receive the text and can hear it through text-to-speech
- This approach ensures reliable communication even with poor internet connectivity

## ✨ Features

### 💯 Core Features

- **Progressive Learning Path**: Step-by-step lessons for mastering ASL
- **Real-time Sign Detection**: Advanced ML model for detecting and translating hand signs
- **Personalized User Journey**: Track progress, unlock achievements, and collect rewards

### 🌟 Premium Features

- **Live Communication**: Real-time sign language translation for conversation
- **Signer Mode**: Convert hand signs to text instantly
- **Talker Mode**: Convert text to signs for two-way communication
- **Unlimited Hearts**: Continue learning without interruption

### 🎮 Gamification

- **Battle Pass**: Seasonal content with rewards and challenges
- **Shop**: Customize your experience with coins and items
- **Achievements**: Complete challenges to earn badges and rewards

## 🛠️ Tech Stack

### Frontend

- **Mobile**: React Native with Expo Router
- **Web**: React with Vite
- **Styling**: Tailwind CSS / NativeWind
- **State Management**: Custom stores with Zustand

### Backend

- **API**: AWS Lambda serverless functions
- **Database**: DynamoDB
- **Realtime Communication**: WebSockets with API Gateway
- **Authentication**: Custom token-based auth

### Machine Learning

- **Framework**: ONNX Runtime
- **Model**: YOLOv11n with image classification for ASL recognition
- **Dataset**: Multiple ASL datasets from Kaggle (see ML Resources section)
- **Inference**: On-device processing for privacy and speed

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- Docker
- AWS CLI (for deployment)

### Installation

#### Mobile App

```bash
cd app/mobile
npm install
npx expo prebuild --clear
npx expo run:android/ios --device
```
