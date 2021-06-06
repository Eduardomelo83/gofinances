import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator} from 'react-native'

import {useFocusEffect} from '@react-navigation/native';
import {useTheme} from 'styled-components'

import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';


import {
    Container,
    Header,
    UserInfo,
    Photo,
    User,
    UserGreeting,
    UserName,
    UserWrapper,
    Icon,
    HighlightCards,
    Transactions,
    Title,
    TransactionList,
    LogoutButton,
    LoadContainer
} from './styles';
import { useAuth } from '../../hooks/auth';

export interface DataListProps extends TransactionCardProps {
    id: string
}

interface HighlightProps{
    amount: string,
    lastTransaction: string
}

interface HighlightData{
    entries: HighlightProps;
    expensives: HighlightProps; 
    total: HighlightProps
}

export function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<DataListProps[]>([]);
    const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData)

    const theme = useTheme()

    const {SignOut, user} = useAuth();

    function getLastTransactionDate(
        collection: DataListProps[],
        type: 'positive' | 'negative'
        ){
            const collectionFilttered = collection
            .filter(transaction => transaction.type === type);

            if(collectionFilttered.length === 0){
                return 0;
            }

            const lastTransactions = new Date( 
            Math.max.apply(Math, collectionFilttered
            .map(transaction => new Date(transaction.date).getTime())))

        return `${lastTransactions.getDate()} de ${lastTransactions.toLocaleString('pt-BR', {month: 'long'})}`
    }

    async function loadTransaction(){
        const dataKey = `@gofinances:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);

        const transactions = response ? JSON.parse(response) : [];

        let entriesTotal = 0;
        let expensiveTotal = 0;

        const transactionsFormatted: DataListProps[] = transactions
        .map((item: DataListProps) => {

            if(item.type === 'positive'){
                entriesTotal += Number(item.amount);

            }else {
                expensiveTotal += Number(item.amount);
            }


            const amount = Number(item.amount)
            .toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const date = Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year:'2-digit'
            }).format(new Date(item.date));

            return {
                id: item.id,
                name: item.name,
                amount,
                type: item.type,
                category: item.category,
                date,
            }

        })
        

        const lasTransactionsEntries = getLastTransactionDate(transactions, 'positive')
        const lasTransactionsExpensive = getLastTransactionDate(transactions, 'negative')
        const totalInterval = lasTransactionsExpensive === 0 
        ? 'Não há transações' 
        : `01 à ${lasTransactionsExpensive}`

        const total = entriesTotal - expensiveTotal;

        setHighlightData({
            entries: {
                amount: entriesTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lasTransactionsEntries === 0 
                ? `Não há transações`
                : `Última entrada dia ${lasTransactionsEntries}`
            },
            expensives: {
                amount: expensiveTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lasTransactionsExpensive === 0 
                ? `Não há transações`
                :`Última saída dia ${lasTransactionsExpensive}` 
            },
            total: {
                amount: total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: totalInterval

            }
        })
        setTransactions(transactionsFormatted);



        setIsLoading(false)
       
    }

    
    useEffect(() => {
        // async function remove() {
        //     await AsyncStorage.removeItem('@gofinances:transactions');
            
        // }
        // remove()
        loadTransaction()

    }, [])

    useFocusEffect(useCallback(() => {
        loadTransaction()
    }, []))
    return (
        <Container>
            
            {
                isLoading ? 
                <LoadContainer>
                    <ActivityIndicator 
                        color={theme.colors.primary}
                        size="large"
                    />
                </LoadContainer> : 
            <>
                
                <Header>
                    <UserWrapper>
                        <UserInfo>
                            <Photo source={{uri: user.photo}}/>
                            <User>
                                <UserGreeting>Olá, </UserGreeting>
                                <UserName>{user.name}</UserName>
                            </User>
                        </UserInfo>
                        <LogoutButton onPress={SignOut}>
                            <Icon name="power"/>
                        </LogoutButton>
                    </UserWrapper>

                </Header>
                
                <HighlightCards>
                    <HighlightCard 
                        type="up"
                        title="Entradas" 
                        amout={highlightData.entries.amount}
                        // amout={'7239577'}
                        lastTransaction={highlightData.entries.lastTransaction}
                    />
                    <HighlightCard
                        type="down"
                        title="Saídas" 
                        amout={highlightData.expensives.amount}
                        // amout={'7239577'}
                        lastTransaction={highlightData.expensives.lastTransaction}
                    />
                    <HighlightCard
                        type="total"
                        title="Total" 
                        amout={highlightData.total.amount}
                        // amout={'7239577'}
                        lastTransaction={highlightData.total.lastTransaction}
                    />
                </HighlightCards>

                <Transactions>
                    <Title>
                        Listagem
                    </Title>
                    <TransactionList
                        data={transactions}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => <TransactionCard  data={item}/>}

                    />
                        
                </Transactions>
            </>
            }
        </Container>
    )
}
