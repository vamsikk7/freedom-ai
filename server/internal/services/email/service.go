package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"time"

	"freedom-ai/management-server/internal/config"
	"go.uber.org/zap"
)

type Service struct {
	config *config.Config
	logger *zap.Logger
}

func NewService(cfg *config.Config, logger *zap.Logger) *Service {
	return &Service{
		config: cfg,
		logger: logger,
	}
}

// SendLowBalanceAlert sends an email alert when wallet balance is low
func (s *Service) SendLowBalanceAlert(to, orgName string, balance, threshold float64) error {
	subject := "Low Wallet Balance Alert - Freedom AI"
	body := fmt.Sprintf(`
Hello,

Your Freedom AI wallet balance for organization "%s" is currently $%.2f, which is below the threshold of $%.2f.

Please top up your wallet to continue using Freedom AI services.

You can top up your wallet at: %s/dashboard/billing

Best regards,
Freedom AI Team
`, orgName, balance, threshold, s.config.CORSOrigin)

	return s.sendEmail(to, subject, body)
}

// SendBillingSummary sends a daily billing summary email
func (s *Service) SendBillingSummary(to, orgName string, summary BillingSummary) error {
	subject := fmt.Sprintf("Daily Billing Summary - %s", time.Now().Format("2006-01-02"))

	tmpl := `
Hello,

Your daily billing summary for organization "%s" for %s:

Period: %s to %s
Total Tokens: %s
Total Cost: $%.2f
Wallet Balance Before: $%.2f
Wallet Balance After: $%.2f

Breakdown by Assistant:
{{range $assistant, $data := .Breakdown.ByAssistant}}
- {{$assistant}}: {{$data.Tokens}} tokens, $%.2f
{{end}}

You can view detailed billing history at: %s/dashboard/billing

Best regards,
Freedom AI Team
`

	t, err := template.New("billing").Parse(tmpl)
	if err != nil {
		return fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, summary); err != nil {
		return fmt.Errorf("failed to execute template: %w", err)
	}

	return s.sendEmail(to, subject, buf.String())
}

// SendAutoTopUpNotification sends a notification when auto-top-up is processed
func (s *Service) SendAutoTopUpNotification(to, orgName string, amount float64) error {
	subject := "Auto-Top-Up Processed - Freedom AI"
	body := fmt.Sprintf(`
Hello,

An automatic wallet top-up of $%.2f has been processed for organization "%s".

Your wallet has been automatically topped up to ensure uninterrupted service.

You can view your billing history at: %s/dashboard/billing

Best regards,
Freedom AI Team
`, amount, orgName, s.config.CORSOrigin)

	return s.sendEmail(to, subject, body)
}

// SendConsumptionLimitWarning sends a warning when consumption approaches limits
func (s *Service) SendConsumptionLimitWarning(to, orgName, limitType string, current, limit int64) error {
	subject := fmt.Sprintf("Consumption Limit Warning - %s", limitType)
	body := fmt.Sprintf(`
Hello,

Your organization "%s" is approaching its %s consumption limit.

Current consumption: %s tokens
Limit: %s tokens
Remaining: %s tokens

Please monitor your usage or consider increasing your limits.

You can view your consumption at: %s/dashboard/consumption

Best regards,
Freedom AI Team
`, orgName, limitType, formatTokens(current), formatTokens(limit), formatTokens(limit-current), s.config.CORSOrigin)

	return s.sendEmail(to, subject, body)
}

// SendUserInvitation sends an invitation email to a new user
func (s *Service) SendUserInvitation(to, userName, orgName, invitationLink string) error {
	subject := "Invitation to Join Freedom AI"
	body := fmt.Sprintf(`
Hello %s,

You have been invited to join the Freedom AI organization "%s".

Click the link below to accept the invitation and set up your account:

%s

If you did not expect this invitation, you can safely ignore this email.

Best regards,
Freedom AI Team
`, userName, orgName, invitationLink)

	return s.sendEmail(to, subject, body)
}

type BillingSummary struct {
	OrgName            string
	PeriodStart        time.Time
	PeriodEnd          time.Time
	TotalTokens        int64
	TotalCost          float64
	WalletBalanceBefore float64
	WalletBalanceAfter  float64
	Breakdown          struct {
		ByAssistant map[string]struct {
			Tokens int64
			Cost   float64
		}
		ByUser map[string]struct {
			Tokens int64
			Cost   float64
		}
	}
}

func (s *Service) sendEmail(to, subject, body string) error {
	// If SMTP is not configured, just log the email
	if s.config.SMTPHost == "" {
		s.logger.Info("Email not sent (SMTP not configured)",
			zap.String("to", to),
			zap.String("subject", subject))
		return nil
	}

	// SMTP configuration
	auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPHost)
	addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, s.config.SMTPPort)

	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s\r\n", to, subject, body))

	err := smtp.SendMail(addr, auth, s.config.SMTPFrom, []string{to}, msg)
	if err != nil {
		s.logger.Error("Failed to send email", zap.Error(err), zap.String("to", to))
		return fmt.Errorf("failed to send email: %w", err)
	}

	s.logger.Info("Email sent successfully", zap.String("to", to), zap.String("subject", subject))
	return nil
}

func formatTokens(tokens int64) string {
	if tokens >= 1000000 {
		return fmt.Sprintf("%.2fM", float64(tokens)/1000000)
	}
	if tokens >= 1000 {
		return fmt.Sprintf("%.2fK", float64(tokens)/1000)
	}
	return fmt.Sprintf("%d", tokens)
}

