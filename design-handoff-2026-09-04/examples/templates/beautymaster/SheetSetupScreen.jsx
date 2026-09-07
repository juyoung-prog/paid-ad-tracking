import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';

/**
 * SheetSetupScreen component
 *
 * Full-screen empty state shown on first visit when no Google Sheets URL is configured.
 * Single CTA opens SheetSettingsModal.
 *
 * Props:
 * @param {function} onSetup - "Connect Google Sheets" button click handler [Required]
 *
 * Example usage:
 * <SheetSetupScreen onSetup={() => setSettingsOpen(true)} />
 */
function SheetSetupScreen({ onSetup }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        px: 4,
        py: 8,
        backgroundColor: 'background.default',
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          color: 'text.secondary',
        }}
      >
        <LinkOutlinedIcon sx={{ fontSize: 22 }} />
      </Box>

      {/* Headline */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
        Connect your Google Sheet
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4, textAlign: 'center', maxWidth: 360, lineHeight: 1.7 }}
      >
        Paste your published Google Sheets URL to automatically sync influencer data to your dashboard every 30 seconds.
      </Typography>

      {/* CTA */}
      <Button variant="contained" size="medium" disableElevation onClick={onSetup}>
        Connect Google Sheets
      </Button>

      {/* How-to hint */}
      <Box sx={{ mt: 6, maxWidth: 360, width: '100%' }}>
        <Typography
          variant="overline"
          color="text.disabled"
          sx={{ fontSize: '0.625rem', letterSpacing: '0.1em', display: 'block', mb: 1.5 }}
        >
          How to get your URL
        </Typography>
        {[
          'Open your Google Sheet',
          'File → Share → Publish to web',
          'Set format to "Web page" and click Publish',
          'Copy the link and paste it in the settings',
        ].map((step, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {i + 1}.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {step}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default SheetSetupScreen;
