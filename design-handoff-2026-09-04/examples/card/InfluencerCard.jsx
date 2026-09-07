import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import StatusIconRow from '../data-display/StatusIconRow';

/** Display-only mapping from alert flag value to English label */
const ALERT_LABEL = {
  'agreement-no-attend': 'Visit Unconfirmed',
  'attend-no-collabo': 'Upload Pending',
  'collabo-no-credit': 'Credit Not Sent',
  'credit-shared-no-used': 'Credit Unused',
};

/** @param {Date|null} date */
function formatScheduledTime(date) {
  if (!date) return 'TBD';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * InfluencerCard component
 *
 * Displays one influencer in a 3-layer card.
 * Hero (avatar + name + visit time) / Status (4-stage icons) / Alert badges.
 *
 * Props:
 * @param {Influencer} influencer - Influencer data object [Required]
 * @param {function} onClick - Card click handler — opens Drawer [Required]
 * @param {boolean} isSelected - Highlights the card currently open in the Drawer [Optional, default: false]
 * @param {object} sx - Additional styles [Optional]
 *
 * Example usage:
 * <InfluencerCard influencer={influencer} onClick={() => handleSelect(influencer.id)} isSelected={selectedId === influencer.id} />
 */
function InfluencerCard({ influencer, onClick, isSelected = false, sx }) {
  const {
    fullName = '',
    imageUrl = '',
    scheduledTime = null,
    agreement = false,
    attend = false,
    collaboShared = false,
    creditShared = false,
    alertFlags = [],
    tier = 'tier1',
    platform = '',
  } = influencer || {};

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        backgroundColor: 'background.paper',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'text.disabled' },
        ...sx,
      }}
    >
      {/* Layer 1 — Hero */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, pb: 1.5 }}>
        <Avatar
          src={imageUrl}
          alt={fullName}
          sx={{ width: 40, height: 40, fontSize: 14, fontWeight: 700, flexShrink: 0 }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {fullName || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatScheduledTime(scheduledTime)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, flexShrink: 0 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {tier === 'tier2' ? 'T2' : 'T1'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {platform}
          </Typography>
        </Box>
      </Box>

      {/* Layer 2 — Status */}
      <Box sx={{ px: 2, pb: alertFlags.length > 0 ? 1 : 1.5 }}>
        <StatusIconRow
          agreement={agreement}
          attend={attend}
          collaboShared={collaboShared}
          creditShared={creditShared}
          size={18}
        />
      </Box>

      {/* Layer 3 — Alert badges (only when flags exist) */}
      {alertFlags.length > 0 && (
        <Box sx={{ px: 2, pb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {alertFlags.map(flag => (
            <Chip
              key={flag}
              label={ALERT_LABEL[flag] || flag}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: '0.6875rem',
                fontWeight: 600,
                borderColor: flag === 'collabo-no-credit' ? 'error.main' : 'warning.main',
                color: flag === 'collabo-no-credit' ? 'error.main' : 'warning.main',
                borderRadius: 0,
              }}
            />
          ))}
        </Box>
      )}
    </ButtonBase>
  );
}

export default InfluencerCard;
