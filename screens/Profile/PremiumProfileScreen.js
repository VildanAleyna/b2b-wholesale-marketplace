import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext'; // AuthContext'i içe aktar

const PremiumProfileScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext); // AuthContext'ten logout fonksiyonunu al

  const handleLogout = () => {
    logout(); // Çıkış yapma işlemini gerçekleştir
    navigation.navigate('Home'); // Çıkış yaptıktan sonra giriş ekranına yönlendir
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premium İçerikler</Text>
      <Text style={styles.content}>Bu içerikler sadece premium üyeler için.</Text>


      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('EditProfile')} // Profili düzenleme ekranına yönlendir
      >
        <Text style={styles.buttonText}>Profili Düzenle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Settings')} // Ayarlar ekranına yönlendir
      >
        <Text style={styles.buttonText}>Ayarlar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogout} // Çıkış yapma işlevini çağır
      >
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PremiumProfileScreen;
