import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useCallback, useEffect, useState} from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import { useBottomTabBarHeight} from '@react-navigation/bottom-tabs'
import {VictoryPie} from 'victory-native';

import { addMonths, subMonths } from 'date-fns'

import {useTheme} from 'styled-components'

import { HistoryCard } from '../../components/HistoryCard';
import { categories } from '../../utils/categories';

import {
    Container,
    Header,
    Title,
    Content,
    ChartContainer,
    MonthSelect,
    MonthSelectButoon,
    MonthSelectIcon,
    Month,
    LoadContainer
} from './styles';
import { format } from 'date-fns/esm';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/auth';

interface TransactionData {
    type: 'positive' | 'negative';
    name: string;
    amount: string;
    category: string;
    date: string;
}

interface CategoryData {
    key: string;
    name: string;
    total: Number;
    totalFormatted: string;
    percent: number;
    percentFormatted: string;
    color: string;

}

export function Resume() {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([])

    const {user} = useAuth();

    const theme = useTheme()

    function handelDateChance(action: 'next' | 'prev'){
        if(action === 'next'){
            setSelectedDate(addMonths(selectedDate, 1));

        }else {
            setSelectedDate(subMonths(selectedDate, 1))
            

        }

    }

    async function loadData(){

        setIsLoading(true)
        const dataKey = `@gofinances:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);
        const responseFormated = response ? JSON.parse(response) : [];

        const expensives = responseFormated
        .filter((expensive: TransactionData) => 
            expensive.type === 'negative' &&
            new Date(expensive.date).getMonth() === selectedDate.getMonth() &&
            new Date(expensive.date).getFullYear() === selectedDate.getFullYear()
        );

        const expensiveTotal = expensives.reduce((accumulador: number, expensive: TransactionData) => {
            return accumulador + Number(expensive.amount);
        }, 0);

        console.log(expensiveTotal)
        const totalByCategory: CategoryData[] = [];

        categories.forEach(category => {
            let categorySum = 0;

            expensives.forEach((expensive: TransactionData) => {
                if(expensive.category === category.key){
                    categorySum += Number(expensive.amount);
                }
            });
            if(categorySum > 0){

                const totalFormatted = categorySum.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
                
                const percent = (categorySum / expensiveTotal * 100);
                const percentFormatted = `${percent.toFixed(0)}%`
                totalByCategory.push({
                    key: category.key,
                    name: category.name,
                    total: categorySum,
                    percent,
                    totalFormatted,
                    percentFormatted,
                    color: category.color
                })
            }
        })

        console.log(totalByCategory)

        setTotalByCategories(totalByCategory)
        setIsLoading(false)

    }

    useFocusEffect(useCallback(() => {
        loadData()
    }, [selectedDate]))
    return (
        <Container>
            
            
            <Header>
                <Title>Resumo por categoria</Title>
            </Header>

            {
            isLoading ? 
                <LoadContainer>
                    <ActivityIndicator 
                        color={theme.colors.primary}
                        size="large"
                    />
                </LoadContainer> : 

            <Content 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingBottom: useBottomTabBarHeight()
                }}
            >
                <MonthSelect>
                    <MonthSelectButoon onPress={() => handelDateChance('prev')}>
                        <MonthSelectIcon name="chevron-left"/>
                    </MonthSelectButoon>

                    <Month>
                        {format(selectedDate, 'MMMM, yyyy', {locale: ptBR})}
                    </Month>

                    <MonthSelectButoon onPress={() => handelDateChance('next')}>
                        <MonthSelectIcon name="chevron-right"/>
                    </MonthSelectButoon>
                </MonthSelect>
                <ChartContainer>
                    <VictoryPie
                        data={totalByCategories}
                        colorScale={totalByCategories.map(category => category.color)}
                        style={{
                            labels: {
                                fontSize: RFValue(18),
                                fontWeight: 'bold',
                                fill: theme.colors.shape 
                            }
                        }}
                        labelRadius={50}
                        x="percentFormatted"
                        y="total"
                    />
                </ChartContainer>
                {
                    totalByCategories.map(item => (
                        <HistoryCard
                            key={item.key}
                            title={item.name}
                            amount={item.totalFormatted}
                            color={item.color}
                        />
                    ))
                }
            </Content>

            }

        </Container>
    )
}