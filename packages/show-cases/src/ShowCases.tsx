// eslint-disable-next-line no-unused-vars
import React, { useState,Component} from 'react';
import styled from 'styled-components';
import Card from '@splunk/react-ui/Card';
import CardLayout from '@splunk/react-ui/CardLayout';
import { variables , SplunkThemeProvider} from '@splunk/themes';

import Divider from '@splunk/react-ui/Divider';
import Heading from '@splunk/react-ui/Heading';
import Paragraph from '@splunk/react-ui/Paragraph';
import { createURL, createStaticURL } from '@splunk/splunk-utils/url';
// @ts-ignore
import cover from './static/cover.png';
// @ts-ignore
import llmioc from './static/llmioc.png';
// @ts-ignore
import mcp from './static/mcp.png';
// @ts-ignore
import multimodel from './static/multimodel.png';
// @ts-ignore
import vector from './static/vector.png';
import { StyledGreeting } from './ShowCasesStyles';


const StyledCardContent = styled.div`
    height: 200px;
    width: 45%;
    background: ${variables.neutral200};
`;



class ShowCases extends Component {

    render() {
        // const cardContent = <StyledCardContent />;
        const StyledContainer = styled.div`
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                            width: 400px;
                            `;

        const message = 'Splunk AI Essential leverages the AI capabilities of the Splunk AI Toolkit combined with large language models ' +
            'to demonstrate various ways of utilizing large language models in security and operations domains within Splunk.';

        return (
            <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable" >
                <div style={{
                    backgroundColor: '#111215',
                    color: '#000000',
                    padding: '20px'
                }}>
                    <article>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center', // 水平居中
                        alignItems: 'center',    // 垂直居中（如果需要）
                        width: '100%',           // 父容器宽度
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center', // 水平居中
                            alignItems: 'top',    // 垂直居中（如果需要）
                            width: '60%',           // 父容器宽度
                            flexWrap: 'wrap',
                            padding: '20px'
                        }}>
                            <img
                            src={cover}
                            alt="Introduction"
                            style={{
                                width: '100%',        // 宽度为父容器的20%
                                height: 'auto', // 高度自适应
                            }}
                            />
                            <StyledContainer
                                style={{
                                width: '100%',        // 宽度为父容器的20%
                                height: 'auto', // 高度自适应
                            }}>
                                <StyledGreeting data-testid="greeting">
                                    <Heading level={1}> Introduction</Heading>
                                </StyledGreeting>
                                    <div data-testid="message"><Paragraph>{message}</Paragraph></div>
                            </StyledContainer>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center', // 水平居中
                            // alignItems: 'top',    // 垂直居中（如果需要）
                            width: '40%',           // 父容器宽度
                            flexWrap: 'wrap',
                            padding: '20px'
                        }}>

                            <StyledContainer style={{width: '100%'}}>
                                <Heading level={1}>Showcase</Heading>
                                <Divider />
                                <Paragraph>
                                    Welcome to the AI Showcases. Watch and learn from AI examples using real datasets.
                                    Click on an example to pre-populate the Assistant with the sample dataset and its settings. Inspect the Search Processing Language as well as the underlying code of these examples to see how it all works..
                                </Paragraph>
                            </StyledContainer>

                            <CardLayout
                                gutterSize={20}
                                alignCards="center"
                                cardWidth="45%"
                                wrapCards
                                style={{width: '100%'}}
                            >
                                <Card  to={createURL('/app/ai-samples/casedemo1')} openInNewContext>
                                    <Card.Header title="LLM-enhanced analysis" />
                                    <Card.Body>
                                        <img
                                            src={llmioc}
                                            style={{
                                                width:'200px',        // 宽度为父容器的20%
                                                height: '200px', // 高度自适应
                                            }}
                                        />
                                    </Card.Body>
                                </Card>
                                <Card to={createURL('/app/ai-samples/casedemo2')} openInNewContext>
                                    <Card.Header title="Multi-model collaboration" />
                                    <Card.Body>
                                        <img
                                        src={multimodel}
                                        style={{
                                            width:'200px',        // 宽度为父容器的20%
                                            height: '200px', // 高度自适应
                                        }}
                                    /></Card.Body>
                                </Card>
                                <Card to={createURL('/app/ai-samples/casedemo3')} openInNewContext>
                                    <Card.Header title="Vector search in LLM" />
                                    <Card.Body>
                                        <img
                                        src={vector}
                                        style={{
                                            width:'200px',        // 宽度为父容器的20%
                                            height: '200px', // 高度自适应
                                        }}
                                    /></Card.Body>
                                </Card>
                                <Card to={createURL('/app/ai-samples/casedemo4')} openInNewContext>
                                    <Card.Header title="MCP with Splunk LLM" />
                                    <Card.Body>
                                        <img
                                        src={mcp}
                                        style={{
                                            width:'200px',        // 宽度为父容器的20%
                                            height: '200px', // 高度自适应
                                        }}
                                    /></Card.Body>
                                </Card>
                            </CardLayout>
                        </div>
                    </div>
                </article>
                </div>
            </SplunkThemeProvider>
        );
    }
}

export default ShowCases;
