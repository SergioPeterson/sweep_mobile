import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
}

export function Avatar({ name, imageUrl, size = 44 }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const fontSize = size * 0.4;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '600',
    color: colors.slate500,
  },
  image: {
    backgroundColor: colors.slate100,
  },
});
