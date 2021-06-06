import React from 'react';

import {
    Container,
    Header,
    Title,
    Icon,
    Footer,
    Amount,
    LastTransaction
} from './styles';

interface Props {
    type: 'up' | 'down' | 'total';
    title: string;
    amout: string,
    lastTransaction: string;

} 

const icon = {
    up: 'arrow-up-circle',
    down: 'arrow-down-circle',
    total: 'dollar-sign'
}

export function HighlightCard({title, amout, lastTransaction, type}: Props){
    return(
        <Container type={type}>
            <Header>
                <Title type={type}>
                    {title}
                    </Title>
                <Icon
                 name={icon[type]}
                  type={type}
                />
            </Header>
            <Footer>
                <Amount type={type}>
                    {amout}
                </Amount>
                <LastTransaction type={type}>
                    {lastTransaction}
                </LastTransaction>

            </Footer>
        </Container>
    )
}