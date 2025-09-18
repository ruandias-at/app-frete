const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email, token, userName) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Recuperação de Senha - Sistema de Frete',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🚛 Sistema de Frete</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Recuperação de Senha</p>
          </div>
          
          <div style="padding: 40px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Olá, ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Recebemos uma solicitação para redefinir a senha da sua conta. 
              Use o código abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: white; display: inline-block; padding: 30px 40px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="color: #667eea; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin-bottom: 10px;">
                  ${token}
                </div>
                <p style="color: #999; font-size: 14px; margin: 0;">Código de verificação</p>
              </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚠️ <strong>Importante:</strong> Este código expira em 15 minutos e só pode ser usado uma vez.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Se você não solicitou a recuperação de senha, pode ignorar este email com segurança.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Este é um email automático, não responda a esta mensagem.
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: #999; text-align: center; padding: 20px; font-size: 12px;">
            <p style="margin: 0;">© 2024 Sistema de Frete. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email de recuperação enviado para:', email);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Conexão com email configurada corretamente');
      return true;
    } catch (error) {
      console.error('Erro na configuração do email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();