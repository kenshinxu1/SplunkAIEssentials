import React, { Component } from 'react';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import TabLayout from '@splunk/react-ui/TabLayout';
import { SplunkThemeProvider } from '@splunk/themes';
import List from '@splunk/react-ui/List';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Button from '@splunk/react-ui/Button'
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import Link from '@splunk/react-ui/Link';
import CollapsiblePanel from '@splunk/react-ui/CollapsiblePanel';
import Chip from '@splunk/react-ui/Chip';
import Layout from '@splunk/react-ui/Layout';
import styled from 'styled-components';
// @ts-ignore
import SearchJob from '@splunk/search-job';
import Code from '@splunk/react-ui/Code';
import { createURL } from '@splunk/splunk-utils/url';
import variables from '@splunk/themes/variables';
// @ts-ignore
import Markdown from '@splunk/react-ui/Markdown';
// @ts-ignore
import Table from '@splunk/visualizations/Table';
// @ts-ignore
import caseflow from './static/caseflow4.png';
import MessageBar from '@splunk/react-ui/MessageBar';

class CaseDemo4 extends Component {
    constructor(props: {}) {
        super(props);
        this.state = {
            search: `| llmmcp prompt="统计_internal索引中不同数据类型各自的数量"
| table *`,
            search2: `| llmmcp prompt="列出所有索引"
| table *`,
            searching: false,
            error: null,
            collaps1: true,
            collaps2: true,
            collaps3: true,
            activepanal: "original",
            tabledata: {
                primary: {
                    requestParams: { offset: 0, count: 20 },
                    data: {
                        fields: [],
                        columns: [],
                    },
                    meta: { totalCount: 100 },
                },
            },
            oridata: {
                primary: {
                    requestParams: { offset: 0, count: 20 },
                    data: {
                        fields: [],
                        columns: [],
                    },
                    meta: { totalCount: 100 },
                },
            },
        };
        this.handleOriginSearch();
    }

    fromJSONArray = (results: any[]) => {
        let fieldList: any[] | null = [];
        if (fieldList == null || fieldList.length === 0) {
            if (results.length > 0) {
                const rowSample = results[0];
                fieldList = Object.keys(rowSample).map((field) => ({
                    name: field,
                }));
            } else {
                fieldList = [];
            }
        }
        const columns = fieldList.map(({ name }) =>
            results.reduce((col, row) => {
                col.push(row[name] === void 0 ? null : row[name]);
                return col;
            }, []),
        );
        return { fields: fieldList, columns };
    };

    handleAISearch = () => {
        console.log('start search!!!');
        this.setState({ searching: true });
        SearchJob.create(
            {
                search: this.state.search,
                earliest_time: '-60m@m',
                latest_time: 'now',
            },
            {
                app: 'ai-samples',
                owner: 'admin',
            },
        )
            .getResults({ count: 0 })
            .subscribe({
                next: (response: { results: string | any[] }) => {
                    console.log(response);
                    if (response.results && response.results.length > 0) {
                        console.log('set result to state');
                        const table = {
                            primary: {
                                requestParams: { offset: 0, count: 20 },
                                data: this.fromJSONArray(response.results),
                                meta: { totalCount: 100 },
                            },
                        };
                        console.log(table);
                        this.setState({
                            searching: false,
                            activepanal: "aidata",
                            tabledata: table,
                            error: null
                        });
                    }
                },
                error: (err: any) => {
                    console.log('search Error');
                    console.log(err);
                    this.setState({searching: false, error: err.toString()});
                },
                complete: () => {
                    console.log('search Done');
                    this.setState({searching: false, error: null});
                },
            });
        console.log(' search end');
    };

    handleOriginSearch = () => {
        console.log('start ori search!!!');
        SearchJob.create(
            {
                search: this.state.search2,
                earliest_time: '-60m@m',
                latest_time: 'now',
            },
            {
                app: 'ai-samples',
                owner: 'admin',
            },
        )
            .getResults({ count: 0 })
            .subscribe({
                next: (response: { results: string | any[] }) => {
                    console.log(response);
                    if (response.results && response.results.length > 0) {
                        console.log('set result to state');
                        const table = {
                            primary: {
                                requestParams: { offset: 0, count: 20 },
                                data: this.fromJSONArray(response.results),
                                meta: { totalCount: 100 },
                            },
                        };
                        console.log(table);
                        this.setState({
                            oridata: table,
                            activepanal: "original",
                            error: null
                        });
                    }
                },
                error: (err: any) => {
                    console.log('Ori search Error');
                    console.log(err);
                    this.setState({searching: false,error: err.toString()});
                },
                complete: () => {
                    console.log('ori search Done');
                    this.setState({searching: false, error: null});
                },
            });
        console.log(' search end');
    };

    render() {
        const handleC1Change = () => {
            console.log(this.state.collaps1);
            this.setState((prev) => ({
                collaps1: !prev.collaps1
            }));
        };

        const handleC2Change = () => {
            this.setState((prev) => ({
                collaps2: !prev.collaps2
            }));
        };

        const handleC3Change = () => {
            this.setState((prev) => ({
                collaps3: !prev.collaps3
            }));
        };
        const handleRequestClose = () => {
            this.setState({error: null});
        };

        const StyledContainer = styled.div`
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 400px;
        `;

        const BoxWrapper = styled.div`
            background-color: ${variables.neutral400};
            gap: 10px;
        `;

        const colStyle = {
            border: `1px solid `,
            padding: 10,
            minHeight: 80,
        };
        const description = `In security and IT operations scenarios, Splunk MCP provides a rich set of tools (such as run_splunk_query, get_indexes, get_metadata, etc.) for efficiently querying logs, indexes, metadata, and knowledge objects.But:

- The cloud or SaaS version of ES AI Assistant may already have the capability to automatically recognize and invoke MCP tool parameters
- However, in on-prem environments, ES AI Assistant cannot be directly used at this time
- On-prem LLMs require manual registration of tools and parameters and cannot automatically invoke MCP like their cloud counterparts

This case demonstrates how to achieve higher security and compliance requirements by invoking an on-premises MCP server through a local Splunk deployment.
`;


        const search = `1| llmmcp prompt="统计_internal索引中不同数据类型各自的数量 | table *
2| llmmcp prompt="列出所有索引" | table *`;

        const comments = `// get number of event by sourcetype through MCP
// list all index through MCP`;

        const usecaseflow = `
## The specific steps of this use case are as follows:
1. Execute multi-round queries to MCP to get information from Splunk
1. Support Splunk Webhook integration to enable automated alert-triggered investigations

- The FastAPI Orchestrator serves as the bridge between local LLMs and MCP
- TOOL_REGISTRY dynamically stores MCP tool and parameter information
- Webhook integration enables Splunk alerts to trigger LLM investigations
`;
        const Prerequisites =` [AI Toolkit](https://docs.splunk.com/Documentation/MLApp/5.6.3/User/AboutMLTK) is installed
custom command to connect to MCP through API is deployed or developed

   Setup Local MCP：
1. Build a local FastAPI service (Orchestrator) to enable on-premises LLMs to:
1. Dynamically register MCP tools and parameters
`;
        // @ts-ignore
        return (
            <SplunkThemeProvider family="prisma" colorScheme="light" density="comfortable">
                <StyledContainer style={{ width: '100%' }}>
                    <Heading level={1}>Splunk MCP-mediated LLM execution in local environment</Heading>
                </StyledContainer>
                <ColumnLayout>
                    <ColumnLayout.Row>
                        <ColumnLayout.Column style={colStyle} span={7}>
                            <Heading level={2}>Description</Heading>
                            <br />
                                <Markdown style={{"max-width":1000}} text={description} />
                        </ColumnLayout.Column>
                        <ColumnLayout.Column style={colStyle} span={5}>
                            <Heading level={2}>Category</Heading>
                            <br />
                            <Layout>
                                <Chip appearance="info">MCP</Chip>
                                <Chip appearance="success">Splunk</Chip>
                                <Chip appearance="warning">LLM</Chip>
                            </Layout>
                        </ColumnLayout.Column>
                    </ColumnLayout.Row>
                    <CollapsiblePanel
                        title="Prerequisites"
                        onChange={handleC1Change}
                        open={this.state.collaps1}
                    >
                        <Markdown style={{"max-width":1000}} text={Prerequisites} />
                    </CollapsiblePanel>
                    <CollapsiblePanel
                        title="How this Use Case Work"
                        onChange={handleC2Change}
                        open={this.state.collaps2}
                    >
                        <ColumnLayout.Row>
                            <ColumnLayout.Column span={7}>
                                <Markdown text={usecaseflow} />
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={5}>
                                <img
                                    src={caseflow}
                                    alt="Introduction"
                                    style={{
                                        width: '100%', // 宽度为父容器的20%
                                        height: 'auto', // 高度自适应
                                    }}
                                />
                            </ColumnLayout.Column>
                        </ColumnLayout.Row>
                    </CollapsiblePanel>
                    <CollapsiblePanel
                        title="Show Search"
                        onChange={handleC3Change}
                        open={this.state.collaps3}
                    >
                        <ColumnLayout.Row>
                            <ColumnLayout.Column span={6}>
                                <Code containerAppearance="section" value={search} />
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={6}>
                                <Code containerAppearance="section" value={comments} />
                            </ColumnLayout.Column>
                        </ColumnLayout.Row>
                        <Link
                            appearance="standalone"
                            to={createURL('app/ai-samples/search?q=') + this.state.search}
                            openInNewContext
                        >
                            Open in New Search
                        </Link>
                        <ColumnLayout.Row>
                            <ColumnLayout.Column span={4}></ColumnLayout.Column>
                            <ColumnLayout.Column
                                style={{ textAlign: 'center', padding: 10 }}
                                span={4}
                            >
                                <Button
                                    label="Execute Search"
                                    inline
                                    disabled={this.state.searching}
                                    appearance="primary"
                                    onClick={this.handleAISearch}
                                />
                                {'     '}
                                {this.state.searching ?  <Button label="Loading" appearance="subtle" /> : null}
                                {this.state.searching ? <WaitSpinner size="medium" screenReaderText="waiting" /> : null}
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={4}></ColumnLayout.Column>
                        </ColumnLayout.Row>
                        <ColumnLayout.Row>
                            <section>
                                <Layout style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {this.state.error?
                                        <MessageBar
                                            type="error"
                                            onRequestClose={handleRequestClose}
                                        >
                                            {this.state.error}
                                        </MessageBar>
                                        :null }
                                </Layout>
                            </section>
                        </ColumnLayout.Row>
                    </CollapsiblePanel>
                </ColumnLayout>
                <TabLayout activePanelId={this.state.activepanal} >
                    <TabLayout.Panel label="Sample 1 Results" panelId="original">
                        <ColumnLayout.Row style={{ height: 800 }}>
                            <ColumnLayout.Column span={8} style={{ height: 800 }}>
                                <Table
                                    height={800}
                                    dataSources={this.state.oridata}
                                    context={{
                                        tableRowBackgroundColor: ['#dddddd', 'white'],
                                        tableRowColor: ['#2c2c2c'],
                                        columnBackgroundColor: ['#74deee'],
                                        columnColor: ['#333333'],
                                    }}
                                    options={{
                                        backgroundColor: 'white',
                                        showInternalFields: false,
                                        tableFormat: {
                                            headerBackgroundColor: '#6b6b6b',
                                            headerColor: 'white',
                                            rowBackgroundColors:
                                                '> table | pick(tableRowBackgroundColor)',
                                            rowColors: '> table | pick(tableRowColor)',
                                        },
                                        columnFormat: {
                                            ai_result_1: {
                                                width: 600,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnColor)',
                                            },
                                        },
                                    }}
                                />
                            </ColumnLayout.Column>
                        </ColumnLayout.Row>
                    </TabLayout.Panel>
                    <TabLayout.Panel label="Sample 2 Results" panelId="aidata">
                        <ColumnLayout.Row style={{ height: 800 }}>
                            <ColumnLayout.Column span={8} style={{ height: 800 }}>
                                <Table
                                    height={800}
                                    key={this.state.key}
                                    dataSources={this.state.tabledata}
                                    context={{
                                        tableRowBackgroundColor: ['#dddddd', 'white'],
                                        tableRowColor: ['#2c2c2c'],
                                        columnBackgroundColor: ['#74deee'],
                                        columnColor: ['#333333'],
                                    }}
                                    options={{
                                        backgroundColor: 'white',
                                        showInternalFields: false,
                                        tableFormat: {
                                            headerBackgroundColor: '#6b6b6b',
                                            headerColor: 'white',
                                            rowBackgroundColors:
                                                '> table | pick(tableRowBackgroundColor)',
                                            rowColors: '> table | pick(tableRowColor)',
                                        },
                                        columnFormat: {
                                            ai_result_1: {
                                                width: 600,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnColor)',
                                            },
                                        },
                                    }}
                                />
                            </ColumnLayout.Column>
                        </ColumnLayout.Row>
                    </TabLayout.Panel>
                </TabLayout>
            </SplunkThemeProvider>
        );
    }
}

export default CaseDemo4;
