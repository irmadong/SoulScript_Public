# SoulScript 🌟

> **A journal that grows with you, one reflection at a time.**

SoulScript is an AI-powered journaling app that guides users through emotional expression using multi-turn, reflective dialogue. Transform your thoughts into beautiful journal entries with the help of AI-driven conversations.


## ✨ Features

### 🎯 **Core Features (Implemented)**

- **🔐 Authentication Landing Page** - Secure Google OAuth integration UI
- **💭 Freewriting Input** - Express your thoughts and feelings freely
- **🤖 Multi-Turn AI Dialogue** - Guided conversations with 5 reflective questions
- **⏰ Early Exit Option** - End dialogue at any point with "Finish Journal"
- **📝 Journal Synthesis** - AI-generated beautiful journal entries
- **📚 Journal History** - View all past entries with date/time stamps
- **✏️ Edit Functionality** - Modify journal entries with modal editor
- **🗑️ Delete Functionality** - Remove entries with confirmation dialog
- **📱 Responsive Design** - Works seamlessly on desktop and mobile
- **🎨 Beautiful UI** - Glassmorphism effects with rose-orange-amber gradient theme
- **☁️ Cloud Storage** - Supabase database integration
- **🔑 Google Authentication** - Real OAuth implementation
- **🔄 Cross-Device Sync** - Access journals from anywhere
- **🔍 Search & Filter** - Find specific journal entries
- **🤖 OpenAI Integration** - Dynamic AI responses instead of hardcoded ones
### 🔄 **Planned Features**
- **📊 Analytics** - Track emotional patterns over time
- **🤖 OpenAI Improvement** - Prompt Engineering

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with TypeScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Lucide React** - Modern icon library

### **Backend**
- **Supabase** - PostgreSQL database + Authentication + Edge Functions ✅
- **OpenAI API** - GPT-powered dialogue generation (planned)
- **Google OAuth** - Secure authentication ✅

### **Deployment**
- **Vercel** - Frontend hosting and deployment
- **GitHub** - Version control and CI/CD

## 🚀 Current Progress

### ✅ **Completed (Frontend)**

| Feature | Status | Description |
|---------|--------|-------------|
| Authentication UI | ✅ | Google sign-in landing page with security features |
| Landing Page | ✅ | Welcome page with feature overview and dual action buttons |
| Input Interface | ✅ | Emotion/thought input with beautiful textarea |
| Dialogue System | ✅ | 5-turn conversation with hardcoded AI responses |
| Journal Synthesis | ✅ | Generate formatted journal entries from dialogue |
| History View | ✅ | List all journal entries with previews |
| Edit Modal | ✅ | Full-screen editor for modifying entries |
| Delete Confirmation | ✅ | Safe deletion with confirmation dialog |
| Responsive Design | ✅ | Mobile-first responsive layout |
| State Management | ✅ | React useState for all app state |
| Supabase Setup | ✅ | Database schema and authentication configuration |
| Google OAuth | ✅ | Real authentication implementation working |
| Database Integration | ✅ | Full CRUD operations with Supabase database |
| Account Management | ✅ | Profile display, data export, and account deletion |
| OpenAI Integration | ✅ | Replacing hardcoded responses with dynamic AI dialogue |

### 🔄 **In Progress**

| Feature | Status | Description |
| Prompt Improvement | 🔄 | Improve the dialogue, to be more guided |


### 📋 **Planned**

| Feature | Priority | Description |
|---------|----------|-------------|
| Real-time Sync | High | Cross-device journal synchronization |
| Search Functionality | Medium | Full-text search across journal entries |
| Export Features | Low | PDF/text export of journal entries |
| Analytics Dashboard | Low | Track emotional patterns over time |

## 🎨 Design System

### **Color Palette**
- **Primary**: Rose (500-600) → Orange (500-600) gradient
- **Secondary**: Amber (100-700) for accents
- **Neutral**: Gray (50-800) for text and backgrounds
- **Success**: Green (500) for positive actions
- **Warning**: Blue (500) for information
- **Danger**: Red (600) for destructive actions

### **Typography**
- **Headings**: Bold, gradient text effects
- **Body**: Clean, readable sans-serif
- **Journal Content**: Serif font for warmth and readability

### **Effects**
- **Glassmorphism**: `bg-white/80 backdrop-blur-sm`
- **Gradients**: Multi-stop rose-orange-amber transitions
- **Shadows**: Subtle elevation with `shadow-lg`

## 🏃‍♂️ Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or pnpm
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/soulscript.git
   cd soulscript
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   *Note: Using `--legacy-peer-deps` due to React 19 compatibility with some packages*

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

5. **Set up database tables** ✅
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run the SQL from `database-setup.sql`
   - This creates the required tables and security policies
   - **Status**: Complete - Database fully operational

### **Environment Setup**

Your `.env.local` file is already configured for backend integration:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## 📱 User Experience

### **Current Flow**
1. **Authentication Page** - Welcome screen with Google sign-in UI
2. **Landing Page** - Choose to start dialogue or view history
3. **Input Page** - Share thoughts and feelings
4. **Dialogue Page** - 5-turn AI conversation with early exit option
5. **Synthesis Page** - View generated journal entry
6. **History Page** - Browse, edit, and delete past entries

### **Key Interactions**
- **Smooth transitions** between app states
- **Loading states** for better UX
- **Confirmation dialogs** for destructive actions
- **Responsive design** for all screen sizes

## 🔧 Troubleshooting

### **Database Issues**

If you're experiencing database problems:

1. **Check if tables exist**: Click the database icon (🗄️) in the app header to test the connection
2. **Run database setup**: Copy the SQL from `database-setup.sql` and run it in your Supabase SQL Editor
3. **Verify environment variables**: Ensure your `.env.local` has the correct Supabase URL and keys
4. **Check browser console**: Look for error messages that indicate specific issues

### **Common Issues**

- **"relation does not exist" error**: Database tables haven't been created yet
- **Authentication errors**: Google OAuth not configured properly in Supabase
- **Permission denied**: Row Level Security policies need to be set up

## 🧪 Testing

### **Manual Testing Checklist**

- [ ] Authentication page loads correctly
- [ ] Landing page shows both action buttons
- [ ] Input page accepts text and validates
- [ ] Dialogue progresses through 5 turns
- [ ] Early exit generates journal entry
- [ ] Journal synthesis displays formatted text
- [ ] History shows all entries
- [ ] Edit modal opens and saves changes
- [ ] Delete confirmation works
- [ ] Responsive design on mobile

### **Browser Compatibility**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📊 Performance

### **Current Metrics**
- **Bundle Size**: ~2.5MB (with all shadcn/ui components)
- **First Load**: ~800ms (local development)
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)

### **Optimizations**
- Tree-shaking for unused components
- Image optimization with Next.js
- CSS-in-JS with Tailwind for minimal bundle
- Component lazy loading where appropriate

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Code Style**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional Commits** for commit messages

## 📈 Roadmap

### **Phase 1: Backend Integration** ✅ **COMPLETE**
- [x] Supabase project setup
- [x] Database schema implementation
- [x] Google OAuth integration
- [x] Basic CRUD operations
- [x] Account management and data export

### **Phase 2: AI Enhancement** ✅ **COMPLETE**
- [x] OpenAI API integration
- [x] Edge Functions for secure AI calls
- [x] Dynamic dialogue generation
- [x] Improved journal synthesis

### **Phase 3: Advanced Features** (Month 1)
- [ ] Search and filtering
- [ ] Export functionality
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

### **Phase 4: Scale & Polish** (Month 1)
- [ ] Performance optimization
- [ ] Advanced security features
- [ ] User onboarding flow
- [ ] Premium features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Lucide** for the icon set
- **Tailwind CSS** for the utility-first CSS framework
- **Next.js** team for the amazing React framework
- **Supabase** for the backend-as-a-service platform

## 📞 Contact

- **Author**: Jing Dong
- **Email**: jingdong.tech@gmail.com
- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Twitter**: [@yourusername](https://twitter.com/yourusername)

---

<div align="center">
  <p><strong>SoulScript: A journal that grows with you, one reflection at a time.</strong></p>
  <p>Made with ❤️ and AI</p>
</div>
