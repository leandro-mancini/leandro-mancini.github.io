import { Container, Flex } from 'styled-system/jsx'
import { Text } from './ui'

export const Header = () => {
    return (
        <Flex as="header">
            <Container>
                <Text>Header</Text>
            </Container>
        </Flex>
    );
}