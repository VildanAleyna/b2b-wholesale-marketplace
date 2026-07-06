import * as React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Icon from 'react-native-vector-icons/MaterialIcons'; // İkon setini import et

const CardIncoming = () => (
  <View style={[styles.scene, { backgroundColor: '#FFB6B9' }]}>
    <Text style={styles.text}>Kart Gelen İçeriği</Text>
  </View>
);

const CardOutgoing = () => (
  <View style={[styles.scene, { backgroundColor: '#FFB6B9' }]}>
    <Text style={styles.text}>Kart Giden İçeriği</Text>
  </View>
);

const Card = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'CardIncoming', title: 'Kart Gelen' },
    { key: 'CardOutgoing', title: 'Kart Giden' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={SceneMap({
        CardIncoming: CardIncoming,
        CardOutgoing: CardOutgoing,
      })}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get('window').width }}
      renderTabBar={props => (
        <TabBar
          {...props}
          style={{ backgroundColor: '#000' }}  // Card sekmesinin arka plan rengi
          indicatorStyle={{ backgroundColor: '#fff' }}  // Aktif sekme göstergesi rengi
          labelStyle={{ color: '#fff' }}  // Sekme başlığı rengi
          renderIcon={({ route }) => {
            const iconName = route.key === 'CardIncoming' ? 'arrow-downward' : 'arrow-upward';
            return <Icon name={iconName} size={20} color="#fff" />;
          }}
        />
      )}
    />
  );
};

const CashIncoming = () => (
  <View style={[styles.scene, { backgroundColor: '#88B04B' }]}>
    <Text style={styles.text}>Nakit Gelen İçeriği</Text>
  </View>
);

const CashOutgoing = () => (
  <View style={[styles.scene, { backgroundColor: '#88B04B' }]}>
    <Text style={styles.text}>Nakit Giden İçeriği</Text>
  </View>
);

const Cash = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'CashIncoming', title: 'Nakit Gelen' },
    { key: 'CashOutgoing', title: 'Nakit Giden' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={SceneMap({
        CashIncoming: CashIncoming,
        CashOutgoing: CashOutgoing,
      })}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get('window').width }}
      renderTabBar={props => (
        <TabBar
          {...props}
          style={{ backgroundColor: '#fff' }}  // Cash sekmesinin arka plan rengi
          indicatorStyle={{ backgroundColor: '#000' }}  // Aktif sekme göstergesi rengi
          labelStyle={{ color: '#000' }}  // Sekme başlığı rengi
          renderIcon={({ route }) => {
            const iconName = route.key === 'CashIncoming' ? 'arrow-downward' : 'arrow-upward';
            return <Icon name={iconName} size={20} color="#000" />;
          }}
        />
      )}
    />
  );
};

const CaseScreen = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Cash', title: 'Nakit' },
    { key: 'Card', title: 'Kart' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={SceneMap({
        Cash: Cash,
        Card: Card,
      })}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get('window').width }}
      renderTabBar={props => (
        <TabBar
          {...props}
          style={{ backgroundColor: '#FF6F61' }}  // Ana sekme arka plan rengi
          indicatorStyle={{ backgroundColor: '#FFFFFF' }}  // Aktif sekme göstergesi rengi
          labelStyle={{ color: '#FFFFFF' }}  // Sekme başlığı rengi
          renderIcon={({ route }) => {
            const iconName = route.key === 'Cash' ? 'attach-money' : 'credit-card';
            return <Icon name={iconName} size={20} color="#FFFFFF" />;
          }}
        />
      )}
    />
  );
};

export default CaseScreen;

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
