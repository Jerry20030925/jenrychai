import { Html, Body, Container, Heading, Text, Button, Hr, Section, Img } from '@react-email/components';

interface PasswordResetEmailProps {
  name?: string;
  resetUrl: string;
  expiresInMinutes?: number;
  language?: 'zh' | 'en' | 'ja' | 'ko';
}

interface WelcomeEmailProps {
  name?: string;
  loginUrl: string;
  language?: 'zh' | 'en' | 'ja' | 'ko';
}

// 多语言文本
const translations = {
  zh: {
    resetPassword: {
      title: '重设密码',
      subtitle: 'Jenrych AI 账户密码重设',
      greeting: '您好',
      content: '我们收到了您的密码重设请求。如果您确实发起了此请求，请点击下面的按钮来重设您的密码：',
      button: '重设密码',
      securityNotice: '安全提示：此链接将在 {minutes} 分钟后过期，请及时使用。',
      alternativeText: '如果按钮无法点击，请复制以下链接到浏览器中打开：',
      securityWarning: '如果您没有请求重设密码，请忽略此邮件。您的账户仍然是安全的。',
      footer: '此邮件由 Jenrych AI 系统自动发送',
      footer2: '请勿回复此邮件',
      links: '访问 Jenrych AI | 隐私政策 | 服务条款'
    },
    welcome: {
      title: '欢迎加入 Jenrych AI！',
      subtitle: '您的智能AI助手已准备就绪',
      greeting: '您好',
      content1: '感谢您注册 Jenrych AI！我们很高兴您加入我们的智能AI助手平台。',
      content2: '现在您可以开始使用我们的AI助手，享受智能对话、多模态分析、语义搜索等强大功能。',
      button: '立即开始使用',
      features: '🚀 主要功能：',
      feature1: '• 智能AI对话 - 与AI进行自然语言交流',
      feature2: '• 多模态分析 - 支持图片、视频、PDF分析',
      feature3: '• 语义搜索 - 智能搜索和内容推荐',
      feature4: '• 实时联网 - 获取最新信息和数据',
      footer: '如有任何问题，请随时联系我们',
      links: '访问 Jenrych AI | 联系我们'
    }
  },
  en: {
    resetPassword: {
      title: 'Reset Password',
      subtitle: 'Jenrych AI Account Password Reset',
      greeting: 'Hello',
      content: 'We received a request to reset your password. If you initiated this request, please click the button below to reset your password:',
      button: 'Reset Password',
      securityNotice: 'Security Notice: This link will expire in {minutes} minutes. Please use it promptly.',
      alternativeText: 'If the button doesn\'t work, please copy and paste this URL into your browser:',
      securityWarning: 'If you did not request a password reset, please ignore this email. Your account remains secure.',
      footer: 'This email was automatically sent by the Jenrych AI system',
      footer2: 'Please do not reply to this email',
      links: 'Visit Jenrych AI | Privacy Policy | Terms of Service'
    },
    welcome: {
      title: 'Welcome to Jenrych AI!',
      subtitle: 'Your intelligent AI assistant is ready',
      greeting: 'Hello',
      content1: 'Thank you for registering with Jenrych AI! We\'re excited to have you join our intelligent AI assistant platform.',
      content2: 'You can now start using our AI assistant and enjoy features like intelligent conversations, multimodal analysis, semantic search, and more.',
      button: 'Get Started Now',
      features: '🚀 Key Features:',
      feature1: '• Intelligent AI Chat - Natural language conversations with AI',
      feature2: '• Multimodal Analysis - Support for images, videos, and PDF analysis',
      feature3: '• Semantic Search - Intelligent search and content recommendations',
      feature4: '• Real-time Web Access - Get the latest information and data',
      footer: 'If you have any questions, please feel free to contact us',
      links: 'Visit Jenrych AI | Contact Us'
    }
  },
  ja: {
    resetPassword: {
      title: 'パスワードリセット',
      subtitle: 'Jenrych AI アカウントパスワードリセット',
      greeting: 'こんにちは',
      content: 'パスワードリセットのリクエストを受け取りました。このリクエストを開始した場合は、下のボタンをクリックしてパスワードをリセットしてください：',
      button: 'パスワードリセット',
      securityNotice: 'セキュリティ通知：このリンクは{minutes}分後に期限切れになります。お早めにご利用ください。',
      alternativeText: 'ボタンが機能しない場合は、以下のURLをブラウザにコピーして貼り付けてください：',
      securityWarning: 'パスワードリセットをリクエストしていない場合は、このメールを無視してください。アカウントは安全です。',
      footer: 'このメールはJenrych AIシステムによって自動送信されました',
      footer2: 'このメールに返信しないでください',
      links: 'Jenrych AIにアクセス | プライバシーポリシー | 利用規約'
    },
    welcome: {
      title: 'Jenrych AIへようこそ！',
      subtitle: 'あなたのインテリジェントAIアシスタントが準備完了',
      greeting: 'こんにちは',
      content1: 'Jenrych AIにご登録いただき、ありがとうございます！インテリジェントAIアシスタントプラットフォームにご参加いただき、嬉しく思います。',
      content2: '今すぐAIアシスタントの使用を開始し、インテリジェントな会話、マルチモーダル分析、セマンティック検索などの強力な機能をお楽しみください。',
      button: '今すぐ開始',
      features: '🚀 主な機能：',
      feature1: '• インテリジェントAIチャット - AIとの自然言語会話',
      feature2: '• マルチモーダル分析 - 画像、動画、PDF分析をサポート',
      feature3: '• セマンティック検索 - インテリジェント検索とコンテンツ推薦',
      feature4: '• リアルタイムウェブアクセス - 最新の情報とデータを取得',
      footer: 'ご質問がございましたら、お気軽にお問い合わせください',
      links: 'Jenrych AIにアクセス | お問い合わせ'
    }
  },
  ko: {
    resetPassword: {
      title: '비밀번호 재설정',
      subtitle: 'Jenrych AI 계정 비밀번호 재설정',
      greeting: '안녕하세요',
      content: '비밀번호 재설정 요청을 받았습니다. 이 요청을 시작한 경우 아래 버튼을 클릭하여 비밀번호를 재설정하세요:',
      button: '비밀번호 재설정',
      securityNotice: '보안 알림: 이 링크는 {minutes}분 후에 만료됩니다. 즉시 사용하세요.',
      alternativeText: '버튼이 작동하지 않으면 다음 URL을 브라우저에 복사하여 붙여넣으세요:',
      securityWarning: '비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시하세요. 계정은 안전합니다.',
      footer: '이 이메일은 Jenrych AI 시스템에 의해 자동으로 전송되었습니다',
      footer2: '이 이메일에 답장하지 마세요',
      links: 'Jenrych AI 방문 | 개인정보 보호정책 | 서비스 약관'
    },
    welcome: {
      title: 'Jenrych AI에 오신 것을 환영합니다!',
      subtitle: '당신의 지능형 AI 어시스턴트가 준비되었습니다',
      greeting: '안녕하세요',
      content1: 'Jenrych AI에 등록해 주셔서 감사합니다! 지능형 AI 어시스턴트 플랫폼에 참여해 주셔서 기쁩니다.',
      content2: '이제 AI 어시스턴트 사용을 시작하고 지능형 대화, 멀티모달 분석, 시맨틱 검색 등의 강력한 기능을 즐기세요.',
      button: '지금 시작하기',
      features: '🚀 주요 기능:',
      feature1: '• 지능형 AI 채팅 - AI와의 자연어 대화',
      feature2: '• 멀티모달 분석 - 이미지, 비디오, PDF 분석 지원',
      feature3: '• 시맨틱 검색 - 지능형 검색 및 콘텐츠 추천',
      feature4: '• 실시간 웹 액세스 - 최신 정보 및 데이터 획득',
      footer: '궁금한 점이 있으시면 언제든지 문의하세요',
      links: 'Jenrych AI 방문 | 문의하기'
    }
  }
};

export function PasswordResetEmail({ 
  name, 
  resetUrl, 
  expiresInMinutes = 15,
  language = 'zh'
}: PasswordResetEmailProps) {
  const t = translations[language] || translations.zh;
  
  return (
    <Html>
      <Body style={{ backgroundColor: '#f6f9fc', margin: 0, padding: 0 }}>
        <Container style={{ 
          maxWidth: 600, 
          margin: '40px auto', 
          background: '#ffffff', 
          borderRadius: 12, 
          padding: '32px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Logo and Header */}
          <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
            {/* 彩色Logo - 使用SVG内联 */}
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #ff6b35, #f7931e, #ffd23f, #06ffa5, #3b82f6, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              lineHeight: 1
            }}>
              Jenrych
            </div>
            <Heading style={{ 
              fontSize: 28, 
              margin: '0 0 8px',
              color: '#111827',
              fontWeight: 'bold'
            }}>
              {t.resetPassword.title}
            </Heading>
            <Text style={{ 
              fontSize: 16, 
              color: '#6b7280',
              margin: 0
            }}>
              {t.resetPassword.subtitle}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={{ marginBottom: '24px' }}>
            <Text style={{ 
              fontSize: 16, 
              lineHeight: '24px', 
              color: '#111827',
              margin: '0 0 16px'
            }}>
              {t.resetPassword.greeting} {name || (language === 'en' ? 'there' : language === 'ja' ? 'さん' : language === 'ko' ? '님' : '用户')}，
            </Text>
            <Text style={{ 
              fontSize: 16, 
              lineHeight: '24px', 
              color: '#111827',
              margin: '0 0 16px'
            }}>
              {t.resetPassword.content}
            </Text>
          </Section>

          {/* Reset Button */}
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={resetUrl}
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                fontSize: 16,
                fontWeight: '600',
                textDecoration: 'none',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ff6b35, #f7931e, #ffd23f, #06ffa5, #3b82f6, #8b5cf6, #ec4899)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                border: 'none'
              }}
            >
              {t.resetPassword.button}
            </Button>
          </Section>

          {/* Security Notice */}
          <Section style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            padding: '16px', 
            borderRadius: 8, 
            margin: '24px 0' 
          }}>
            <Text style={{ 
              margin: 0, 
              color: '#856404', 
              fontSize: 14,
              lineHeight: '20px'
            }}>
              <strong>{t.resetPassword.securityNotice.replace('{minutes}', expiresInMinutes.toString())}</strong>
            </Text>
          </Section>

          {/* Alternative Link */}
          <Section style={{ 
            margin: '24px 0', 
            padding: '16px', 
            background: '#f1f3f4', 
            borderRadius: 8 
          }}>
            <Text style={{ 
              margin: '0 0 12px', 
              color: '#374151', 
              fontSize: 14,
              lineHeight: '20px'
            }}>
              {t.resetPassword.alternativeText}
            </Text>
            <Text style={{ 
              margin: 0, 
              wordBreak: 'break-all', 
              color: '#2563eb', 
              fontSize: 12, 
              fontFamily: 'monospace', 
              background: 'white', 
              padding: '12px', 
              borderRadius: 6,
              border: '1px solid #e5e7eb'
            }}>
              {resetUrl}
            </Text>
          </Section>

          {/* Security Warning */}
          <Section style={{ 
            margin: '24px 0', 
            padding: '16px', 
            background: '#e3f2fd', 
            borderLeft: '4px solid #2196f3', 
            borderRadius: 4 
          }}>
            <Text style={{ 
              margin: 0, 
              color: '#1976d2', 
              fontSize: 14,
              lineHeight: '20px'
            }}>
              {t.resetPassword.securityWarning}
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={{ 
            border: 'none', 
            borderTop: '1px solid #e5e7eb', 
            margin: '32px 0 24px' 
          }}/>
          
          <Section style={{ textAlign: 'center' }}>
            <Text style={{ 
              margin: '0 0 8px', 
              color: '#6b7280', 
              fontSize: 14 
            }}>
              {t.resetPassword.footer}
            </Text>
            <Text style={{ 
              margin: '0 0 16px', 
              color: '#6b7280', 
              fontSize: 14 
            }}>
              {t.resetPassword.footer2}
            </Text>
            <Text style={{ 
              margin: 0, 
              color: '#6b7280', 
              fontSize: 12 
            }}>
              {t.resetPassword.links.split(' | ').map((link: string, index: number) => {
                const [text, url]: [string, string] = link.includes('访问') ? ['访问 Jenrych AI', 'https://jenrychai.com'] :
                                 link.includes('Visit') ? ['Visit Jenrych AI', 'https://jenrychai.com'] :
                                 link.includes('アクセス') ? ['Jenrych AIにアクセス', 'https://jenrychai.com'] :
                                 link.includes('방문') ? ['Jenrych AI 방문', 'https://jenrychai.com'] :
                                 link.includes('隐私') ? ['隐私政策', 'https://jenrychai.com/privacy'] :
                                 link.includes('Privacy') ? ['Privacy Policy', 'https://jenrychai.com/privacy'] :
                                 link.includes('プライバシー') ? ['プライバシーポリシー', 'https://jenrychai.com/privacy'] :
                                 link.includes('개인정보') ? ['개인정보 보호정책', 'https://jenrychai.com/privacy'] :
                                 link.includes('服务') ? ['服务条款', 'https://jenrychai.com/terms'] :
                                 link.includes('Terms') ? ['Terms of Service', 'https://jenrychai.com/terms'] :
                                 link.includes('利用規約') ? ['利用規約', 'https://jenrychai.com/terms'] :
                                 link.includes('서비스') ? ['서비스 약관', 'https://jenrychai.com/terms'] :
                                 [link, '#'];
                return (
                  <span key={index}>
                    {index > 0 && ' | '}
                    <a href={url} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {text}
                    </a>
                  </span>
                );
              })}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function WelcomeEmail({ name, loginUrl, language = 'zh' }: WelcomeEmailProps) {
  const t = translations[language] || translations.zh;
  
  return (
    <Html>
      <Body style={{ backgroundColor: '#f6f9fc', margin: 0, padding: 0 }}>
        <Container style={{ 
          maxWidth: 600, 
          margin: '40px auto', 
          background: '#ffffff', 
          borderRadius: 12, 
          padding: '32px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Logo and Header */}
          <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
            {/* 彩色Logo - 使用SVG内联 */}
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #ff6b35, #f7931e, #ffd23f, #06ffa5, #3b82f6, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              lineHeight: 1
            }}>
              Jenrych
            </div>
            <Heading style={{ 
              fontSize: 28, 
              margin: '0 0 8px',
              color: '#111827',
              fontWeight: 'bold'
            }}>
              {t.welcome.title}
            </Heading>
            <Text style={{ 
              fontSize: 16, 
              color: '#6b7280',
              margin: 0
            }}>
              {t.welcome.subtitle}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={{ marginBottom: '24px' }}>
            <Text style={{ 
              fontSize: 16, 
              lineHeight: '24px', 
              color: '#111827',
              margin: '0 0 16px'
            }}>
              {t.welcome.greeting} {name || (language === 'en' ? 'there' : language === 'ja' ? 'さん' : language === 'ko' ? '님' : '朋友')}，
            </Text>
            <Text style={{ 
              fontSize: 16, 
              lineHeight: '24px', 
              color: '#111827',
              margin: '0 0 16px'
            }}>
              {t.welcome.content1}
            </Text>
            <Text style={{ 
              fontSize: 16, 
              lineHeight: '24px', 
              color: '#111827',
              margin: '0 0 24px'
            }}>
              {t.welcome.content2}
            </Text>
          </Section>

          {/* Login Button */}
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={loginUrl}
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                fontSize: 16,
                fontWeight: '600',
                textDecoration: 'none',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ff6b35, #f7931e, #ffd23f, #06ffa5, #3b82f6, #8b5cf6, #ec4899)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                border: 'none'
              }}
            >
              {t.welcome.button}
            </Button>
          </Section>

          {/* Features */}
          <Section style={{ 
            background: '#f8fafc', 
            padding: '20px', 
            borderRadius: 8, 
            margin: '24px 0' 
          }}>
            <Text style={{ 
              margin: '0 0 16px', 
              color: '#111827', 
              fontSize: 16,
              fontWeight: '600'
            }}>
              {t.welcome.features}
            </Text>
            <Text style={{ 
              margin: '0 0 8px', 
              color: '#374151', 
              fontSize: 14,
              lineHeight: '20px'
            }}>
              {t.welcome.feature1}
            </Text>
            <Text style={{ 
              margin: '0 0 8px', 
              color: '#374151', 
              fontSize: 14,
              lineHeight: '20px'
            }}>
              {t.welcome.feature2}
            </Text>
            <Text style={{ 
              margin: '0 0 8px', 
              color: '#374151', 
              fontSize: 14,
              lineHeight: '20px'
            }}>
              {t.welcome.feature3}
            </Text>
            <Text style={{ 
              margin: '0 0 8px', 
              color: '#374151', 
              fontSize: 14,
              lineHeight: '20px'
            }}>
              {t.welcome.feature4}
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={{ 
            border: 'none', 
            borderTop: '1px solid #e5e7eb', 
            margin: '32px 0 24px' 
          }}/>
          
          <Section style={{ textAlign: 'center' }}>
            <Text style={{ 
              margin: '0 0 8px', 
              color: '#6b7280', 
              fontSize: 14 
            }}>
              {t.welcome.footer}
            </Text>
            <Text style={{ 
              margin: 0, 
              color: '#6b7280', 
              fontSize: 12 
            }}>
              {t.welcome.links.split(' | ').map((link: string, index: number) => {
                const [text, url]: [string, string] = link.includes('访问') ? ['访问 Jenrych AI', 'https://jenrychai.com'] :
                                 link.includes('Visit') ? ['Visit Jenrych AI', 'https://jenrychai.com'] :
                                 link.includes('アクセス') ? ['Jenrych AIにアクセス', 'https://jenrychai.com'] :
                                 link.includes('방문') ? ['Jenrych AI 방문', 'https://jenrychai.com'] :
                                 link.includes('联系') ? ['联系我们', 'https://jenrychai.com/contact'] :
                                 link.includes('Contact') ? ['Contact Us', 'https://jenrychai.com/contact'] :
                                 link.includes('お問い合わせ') ? ['お問い合わせ', 'https://jenrychai.com/contact'] :
                                 link.includes('문의') ? ['문의하기', 'https://jenrychai.com/contact'] :
                                 [link, '#'];
                return (
                  <span key={index}>
                    {index > 0 && ' | '}
                    <a href={url} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {text}
                    </a>
                  </span>
                );
              })}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
