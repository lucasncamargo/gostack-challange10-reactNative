import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      try {
        const { data } = await api.get<Food>(`foods/${routeParams.id}`);
        setFood({
          ...data,
          formattedPrice: formatValue(data.price),
        });
        const formattedExtras = data.extras.map(item => ({
          ...item,
          quantity: 0,
        }));
        setExtras(formattedExtras);
      } catch (err) {
        console.log(err);
      }
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function checkIsFavorite(): Promise<void> {
      try {
        const { data } = await api.get('favorites');
        const foodIsFavorited = data.filter(
          (item: Food) => item.id === food.id,
        );
        setIsFavorite(foodIsFavorited);
      } catch (err) {
        console.log(err);
      }
    }
    checkIsFavorite();
  }, [food.id]);

  function handleIncrementExtra(id: number): void {
    setExtras(oldExtras =>
      oldExtras.map(item => {
        if (item.id !== id) {
          return item;
        }
        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(oldExtras =>
      oldExtras.map(item => {
        if (item.id !== id) {
          return item;
        }
        return {
          ...item,
          quantity: item.quantity ? item.quantity - 1 : 0,
        };
      }),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(oldFoodQuantity => oldFoodQuantity + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(oldFoodQuantity =>
      oldFoodQuantity > 1 ? oldFoodQuantity - 1 : 1,
    );
  }

  const toggleFavorite = useCallback(async () => {
    try {
      if (!isFavorite) {
        const foodToFavorite = food;
        delete foodToFavorite.extras;
        delete foodToFavorite.formattedPrice;
        await api.post('favorites', foodToFavorite);
      } else {
        await api.delete(`favorites/${food.id}`);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.log(err);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const totalFood = food.price * foodQuantity;
    const totalFoodExtras = extras.reduce((accumulator, currentExtra) => {
      const extraTotal = currentExtra.quantity * currentExtra.value;
      return accumulator + extraTotal;
    }, 0);
    return formatValue(totalFood + totalFoodExtras * foodQuantity);
  }, [extras, food.price, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    try {
      await api.post('orders', {
        product_id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        thumbnail_url: food.image_url,
        quantity: foodQuantity,
        extras,
      });
      navigation.goBack();
    } catch (err) {
      console.log(err);
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
