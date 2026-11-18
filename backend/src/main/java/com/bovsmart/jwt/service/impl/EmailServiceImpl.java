package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.exception.AppException;
import com.bovsmart.jwt.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:vuminhanh201@gmail.com}")
    private String fromEmail;

    @Autowired
    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendPasswordResetOtpEmail(String toEmail, String username, String code) {
        String subject = "[BoVSmart Farm] Mã xác minh đặt lại mật khẩu của bạn";
        String htmlContent = buildResetPasswordHtml(username, code);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "BoVSmart AgriTech Farm");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            // Bảo mật: Không in mã OTP ra log hệ thống
            logger.info("Đã gửi email OTP đặt lại mật khẩu thành công tới tài khoản: {}", toEmail);

        } catch (MessagingException e) {
            logger.error("Lỗi soạn thảo email gửi tới {}: {}", toEmail, e.getMessage());
            throw new AppException("Lỗi định dạng email khi gửi qua máy chủ Gmail. Vui lòng thử lại sau!");
        } catch (Exception e) {
            logger.error("Lỗi kết nối máy chủ gửi mail SMTP Gmail tới {}: {}", toEmail, e.getMessage());
            throw new AppException("Không thể kết nối máy chủ Gmail SMTP để gửi thư. Vui lòng kiểm tra Google App Password hoặc kết nối mạng!");
        }
    }

    private String buildResetPasswordHtml(String username, String code) {
        return "<!DOCTYPE html>"
                + "<html lang='vi'>"
                + "<head>"
                + "  <meta charset='UTF-8'>"
                + "  <style>"
                + "    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }"
                + "    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }"
                + "    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 30px 20px; text-align: center; }"
                + "    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }"
                + "    .body { padding: 32px 28px; color: #334155; line-height: 1.6; font-size: 14px; }"
                + "    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }"
                + "    .otp-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; text-align: center; padding: 22px; margin: 24px 0; }"
                + "    .otp-title { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }"
                + "    .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #065f46; }"
                + "    .expiry-note { font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 10px; }"
                + "    .security-note { background-color: #f1f5f9; border-left: 4px solid #059669; border-radius: 6px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #475569; }"
                + "    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }"
                + "  </style>"
                + "</head>"
                + "<body>"
                + "  <div class='container'>"
                + "    <div class='header'>"
                + "      <h1>BoVSmart Farm AgriTech</h1>"
                + "      <p style='margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;'>Hệ Thống Quản Lý Trang Trại Bò Thông Minh</p>"
                + "    </div>"
                + "    <div class='body'>"
                + "      <div class='greeting'>Xin chào " + (username != null ? username : "Quý khách") + ",</div>"
                + "      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản quản lý trang trại của bạn. Vui lòng sử dụng mã xác minh OTP 6 chữ số dưới đây để tiếp tục:</p>"
                + "      <div class='otp-box'>"
                + "        <div class='otp-title'>Mã Xác Minh (OTP)</div>"
                + "        <div class='otp-code'>" + code + "</div>"
                + "        <div class='expiry-note'>* Mã xác minh có hiệu lực trong vòng 10 phút.</div>"
                + "      </div>"
                + "      <div class='security-note'>"
                + "        <strong>Lưu ý bảo mật:</strong>"
                + "        <ul style='margin: 6px 0 0 0; padding-left: 18px;'>"
                + "          <li>Tuyệt đối không chia sẻ mã OTP này cho bất kỳ ai.</li>"
                + "          <li>Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ ngay Quản trị viên (ADMIN) để bảo vệ tài khoản.</li>"
                + "        </ul>"
                + "      </div>"
                + "    </div>"
                + "    <div class='footer'>"
                + "      © 2026 BoVSmart Farm AgriTech • Nền tảng số hóa nông nghiệp & Blockchain"
                + "    </div>"
                + "  </div>"
                + "</body>"
                + "</html>";
    }
}

