import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface StickyBottomBarProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function StickyBottomBar({ children, style }: StickyBottomBarProps) {
  return <View style={[styles.bar, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
});
