import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import {AuthContext} from '../../context/AuthContext'
const API_URL = 'http://192.168.1.108:3000'; // API URL

const AddProductScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [wholesalerPrice, setWholesalerPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const { user } = useContext(AuthContext);

  const userId= user._id;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/categories`);
        setCategories(data);
      } catch (error) {
        console.error('Unable to fetch categories:', error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      if (category) {
        try {
          const { data } = await axios.get(`${API_URL}/models`);
          console.log('Fetched models:', data); // Log the fetched models

          // Get the selected category object
          const selectedCategory = categories.find(cat => cat._id === category);
          
          // Filter models based on category's modelIds
          const filteredModels = data.filter(model =>
            selectedCategory.modelIds.some(modelId =>
              model._id === modelId
            )
          );

          setModels(filteredModels);
          setModel(''); // Reset model selection when category changes
          setBrands([]); // Clear brands when category changes
        } catch (error) {
          console.error('Unable to fetch models:', error);
        }
      }
    };

    loadModels();
  }, [category, categories]);

  useEffect(() => {
    const loadBrands = async () => {
      if (model) {
        try {
          const { data } = await axios.get(`${API_URL}/brands`);
          console.log('Fetched brands:', data); // Log the fetched brands

          // Get the selected model object
          const selectedModel = models.find(mod => mod._id === model);
          
          // Filter brands based on model's brandIds
          const filteredBrands = data.filter(brand =>
            selectedModel.brandIds.some(brandId =>
              brand._id === brandId
            )
          );

          setBrands(filteredBrands);
        } catch (error) {
          console.error('Unable to fetch brands:', error);
        }
      }
    };

    loadBrands();
  }, [model, models]);

  const handleAddProduct = async () => {
    // Validation
    if (!title || !category || !model || !brand || !price || !image) {
        Alert.alert('Validation Error', 'Please fill in all required fields.');
        return;
    }

    // Ensure numerical fields are valid
    const parsedPrice = parseFloat(price);
    const parsedStockQuantity = parseInt(stockQuantity, 10);
    const parsedMinStockLevel = parseInt(minStockLevel, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid price.');
        return;
    }
    if (isNaN(parsedStockQuantity) || parsedStockQuantity < 0) {
        Alert.alert('Validation Error', 'Please enter a valid stock quantity.');
        return;
    }
    if (isNaN(parsedMinStockLevel) || parsedMinStockLevel < 0) {
        Alert.alert('Validation Error', 'Please enter a valid minimum stock level.');
        return;
    }

    const newProduct = {
        title,
        categoryId: category,
        modelId: model,
        brandId: brand,
        image,
        wholesalers: [
            {
                usersID: userId, 
                price: parsedPrice,
                stockQuantity: parsedStockQuantity,
                minStockLevel: parsedMinStockLevel,
                description,
            }
        ]
    };

    try {
        // Ürünü ekleyin
        const response = await axios.post(`${API_URL}/products`, newProduct);

        if (response.status === 201) {
            console.log('Product added successfully:', response.data);

            // Markayı güncelleyin
            await axios.put(`${API_URL}/brands/${brand}`, { productId: response.data._id });

            // Update user products
            await axios.put(`${API_URL}/users/${userId}/products`, {
              productId: response.data._id,
              price: parsedPrice,
              stockQuantity: parsedStockQuantity,
              minStockLevel: parsedMinStockLevel
          });


            Alert.alert('Success', 'Product added successfully!');
            navigation.goBack();
        }
    } catch (error) {
        console.error('Unable to add product:', error.response ? error.response.data : error.message);
        Alert.alert('Error', error.response ? error.response.data.message : error.message);
    }
};



  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.label}>Product Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <Text style={styles.label}>Category</Text>
        <Picker
          selectedValue={category}
          style={styles.picker}
          onValueChange={(itemValue) => {
            setCategory(itemValue);
            setModel(''); // Reset model selection
            setBrand(''); // Reset brand selection
          }}
        >
          <Picker.Item label="Select a category" value="" />
          {categories.map(cat => (
            <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
          ))}
        </Picker>
        <Text style={styles.label}>Model</Text>
        <Picker
          selectedValue={model}
          style={styles.picker}
          onValueChange={(itemValue) => {
            setModel(itemValue);
            setBrand(''); // Reset brand selection
          }}
          enabled={!!category}
        >
          <Picker.Item label="Select a model" value="" />
          {models.map(mod => (
            <Picker.Item key={mod._id} label={mod.name} value={mod._id} />
          ))}
        </Picker>
        <Text style={styles.label}>Brand</Text>
        <Picker
          selectedValue={brand}
          style={styles.picker}
          onValueChange={setBrand}
          enabled={!!model}
        >
          <Picker.Item label="Select a brand" value="" />
          {brands.map(br => (
            <Picker.Item key={br._id} label={br.name} value={br._id} />
          ))}
        </Picker>
        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          value={image}
          onChangeText={setImage}
        />
        <Text style={styles.label}>Stock Quantity</Text>
        <TextInput
          style={styles.input}
          value={stockQuantity}
          onChangeText={setStockQuantity}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Minimum Stock Level</Text>
        <TextInput
          style={styles.input}
          value={minStockLevel}
          onChangeText={setMinStockLevel}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
        />
        <Button title="Add Product" onPress={handleAddProduct} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 16,
  },
});

export default AddProductScreen;
