import { Tabs } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Find Cleaners',
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
          tabBarLabel: 'Bookings',
        }}
      />
      <Tabs.Screen
        name="cleaner/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
