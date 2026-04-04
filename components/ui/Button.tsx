import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors } from '@/lib/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.forest700, text: colors.white },
  secondary: { bg: colors.white, text: colors.forest700, border: colors.border },
  destructive: { bg: colors.error, text: colors.white },
  ghost: { bg: 'transparent', text: colors.forest700 },
};

const sizeStyles: Record<ButtonSize, { px: number; py: number; fontSize: number }> = {
  sm: { px: 12, py: 6, fontSize: 13 },
  md: { px: 20, py: 12, fontSize: 15 },
  lg: { px: 24, py: 16, fontSize: 17 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading && <ActivityIndicator color={v.text} size="small" style={styles.loader} />}
      <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  text: {
    fontWeight: '600',
  },
  loader: {
    marginRight: 8,
  },
});
