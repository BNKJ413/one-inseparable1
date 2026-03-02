// Brand colors and base email template
export const BRAND_COLORS = {
  primary: '#C9A86C',      // Soft gold
  background: '#FAF8F5',   // Warm neutral
  text: '#2D2D2D',         // Dark text
  textLight: '#6B6B6B',    // Muted text
  accent: '#8B7355',       // Warm brown
  success: '#4CAF50',      // Green
  border: '#E8E0D5',       // Light border
};

export const baseEmailTemplate = (content: string, previewText?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ONE | Inseparable</title>
  ${previewText ? `<span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body, table, td {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 20px !important;
      }
      .content {
        padding: 24px !important;
      }
      .header-logo {
        font-size: 24px !important;
      }
      .main-heading {
        font-size: 22px !important;
      }
      .cta-button {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.background}; width: 100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND_COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px; border-bottom: 1px solid ${BRAND_COLORS.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <span class="header-logo" style="font-size: 28px; font-weight: 700; color: ${BRAND_COLORS.primary}; letter-spacing: 1px;">
                      ONE
                    </span>
                    <span style="font-size: 14px; color: ${BRAND_COLORS.textLight}; display: block; margin-top: 4px;">
                      Inseparable
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid ${BRAND_COLORS.border}; background-color: ${BRAND_COLORS.background}; border-radius: 0 0 16px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <span style="font-size: 13px; color: ${BRAND_COLORS.textLight};">
                      Building stronger marriages, one day at a time.
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-size: 12px; color: ${BRAND_COLORS.textLight};">
                      © ${new Date().getFullYear()} ONE | Inseparable. All rights reserved.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const buttonStyle = `
  display: inline-block;
  padding: 14px 32px;
  background-color: ${BRAND_COLORS.primary};
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  border-radius: 8px;
  text-align: center;
`;

export const secondaryButtonStyle = `
  display: inline-block;
  padding: 12px 24px;
  background-color: transparent;
  color: ${BRAND_COLORS.primary};
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border-radius: 8px;
  border: 2px solid ${BRAND_COLORS.primary};
  text-align: center;
`;

export const headingStyle = `
  font-size: 26px;
  font-weight: 700;
  color: ${BRAND_COLORS.text};
  margin: 0 0 16px 0;
  line-height: 1.3;
`;

export const subheadingStyle = `
  font-size: 18px;
  font-weight: 600;
  color: ${BRAND_COLORS.text};
  margin: 24px 0 12px 0;
`;

export const paragraphStyle = `
  font-size: 16px;
  color: ${BRAND_COLORS.text};
  line-height: 1.6;
  margin: 0 0 16px 0;
`;

export const highlightBoxStyle = `
  background-color: ${BRAND_COLORS.background};
  border-left: 4px solid ${BRAND_COLORS.primary};
  padding: 20px;
  margin: 24px 0;
  border-radius: 0 8px 8px 0;
`;
