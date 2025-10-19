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
import caseflow from './static/caseflow1.png';

class CaseDemo1 extends Component {
    constructor(props: {}) {
        super(props);
        this.state = {
            search: `| inputlookup case1_es_notables.csv
| table notable_id rule_name dest_ip src_ip domain url file_hash email urgency search_name
| eval indicator=coalesce(file_hash, url, domain, dest_ip, src_ip, email)
| where indicator!=""
| table notable_id rule_name indicator
| ai provider=Ollama model=foundation8b:latest prompt="你是安全分析助手，请判断以下字符串的IOC类型（仅从domain, url, ip, hash, email中选择），只返回IOC类型（仅从domain, url, ip, hash, email中选择）。输入：{indicator}"
| rename ai_result_1 as ioc_type
| lookup case1_ioc_prompt_lookup.csv ioc_type OUTPUT prompt_template
| ai prompt="'{prompt_template}'。输入：'{indicator}'"`,
            search2: `index=_internal | head 200`,
            results: {
                fields: ['a', 'b'],
                results: [
                    ['A1', 'A2'],
                    ['B1', 'B2'],
                ],
            },
            searching: false,
            collaps1: true,
            collaps2: true,
            collaps3: true,
            key: 0,
            searchQuery: 'index=_internal | head 1',
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
        };
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

    handleSearch = () => {
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
                            // results: response,
                            searching: false,
                            tabledata: table,
                        });
                    }
                },
                error: (err: any) => {
                    console.log(err);
                },
                complete: () => {
                    console.log('search Done');
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

        const search = `1. | inputlookup case1_es_notables.csv
2. | table notable_id rule_name dest_ip src_ip domain url file_hash email urgency search_name
3. | eval indicator=coalesce(file_hash, url, domain, dest_ip, src_ip, email)
4. | where indicator!=""
5. | table notable_id rule_name indicator
6. | ai provider=Ollama model=foundation8b:latest prompt="你是安全分析助手，请判断以下字符串的IOC类型（仅从domain, url, ip, hash, email中选择），只返回IOC类型（仅从domain, url, ip, hash, email中选择）。输入：{indicator}"
7. | rename ai_result_1 as ioc_type
8. | lookup case1_ioc_prompt_lookup.csv ioc_type OUTPUT prompt_template
9. | ai prompt="'{prompt_template}'。输入：'{indicator}'"`;

        const comments = `// get Notable details
// format fields in table
// defined standard indicator types
// filter out empty indicator
// table format
// use LLM Model to get IOC type base on notable content
// field format
// enhance IOC content with  template
// use LLM Model to get IOC details base on IOC type returned by first LLM call`;

        const usecaseflow = `
## The specific steps of this use case are as follows:
1. Get Security Notable: Retrieve security notable information from Splunk by SPL
1. Define the list of Indicator of Compromise (IOC) to be analyzed.
1. Call LLM - Use a Large Language Model (LLM) to determine the IOC category based on the security notable.
1. IOC Prompt Template lookup: Look up the prompt template corresponding to the IOC category.
1. Call LLM - Generate IOC Based analysis of security issues: Leverage the LLM and the prompt template to generate an analysis of security issues based on the IOC.
1. Create Alert OR Add Context to Security Notable
`;

        // @ts-ignore
        return (
            <SplunkThemeProvider family="prisma" colorScheme="light" density="comfortable">
                <StyledContainer style={{ width: '100%' }}>
                    <Heading level={1}>LLM-enhanced analysis base on IOC</Heading>
                </StyledContainer>
                <ColumnLayout>
                    <ColumnLayout.Row>
                        <ColumnLayout.Column style={colStyle} span={7}>
                            <Heading level={2}>Description</Heading>
                            <br />
                            <P>
                                Use Splunk products to take advantage of one platform for all your
                                security and observability data needs. In an ever-changing world,
                                Splunk delivers insights to unlock innovation, enhance security and
                                drive resilience.
                            </P>
                            <P>
                                <Link
                                    to="https://www.splunk.com/en_us/products/platform.html"
                                    openInNewContext
                                >
                                    The Splunk Platform
                                </Link>{' '}
                                allows you turn data into doing to unlock innovation, enhance
                                security and drive resilience.{' '}
                                <Link
                                    to="https://www.splunk.com/en_us/products/cyber-security.html"
                                    openInNewContext
                                >
                                    Splunk Security
                                </Link>{' '}
                                protects your business and modernize your security operations with a
                                best-in-class data platform, advanced analytics and automated
                                investigations and response.{' '}
                                <Link
                                    to="https://www.splunk.com/en_us/products/observability.html"
                                    openInNewContext
                                >
                                    Splunk Observability
                                </Link>{' '}
                                solves problems in seconds with the only full-stack,
                                analytics-powered and OpenTelemetry-native observability solution.
                            </P>
                        </ColumnLayout.Column>
                        <ColumnLayout.Column style={colStyle} span={5}>
                            <Heading level={2}>Category</Heading>
                            <br />
                            <Layout>
                                <Chip appearance="info">LLM</Chip>
                                <Chip appearance="success">IOC</Chip>
                                <Chip appearance="warning">Security</Chip>
                            </Layout>
                        </ColumnLayout.Column>
                    </ColumnLayout.Row>
                    <CollapsiblePanel
                        title="Prerequisites"
                        onChange={handleC1Change}
                        open={this.state.collaps1}
                    >
                        <List>
                            <List.Item>AI Toolkit is installed </List.Item>
                            <List.Item>
                                LLM connection is configured Properly and Security model like
                                foundation8b and General model like deepseek are available to
                                use{' '}
                            </List.Item>
                            <List.Item>
                                The lookup table for IOC indicator is configured (optional)
                            </List.Item>
                        </List>
                    </CollapsiblePanel>
                    <CollapsiblePanel
                        title="How this Use Case Work"
                        onChange={handleC2Change}
                        open={this.state.collaps2}
                    >
                        <ColumnLayout.Row>
                            <ColumnLayout.Column span={6}>
                                <Markdown text={usecaseflow} />
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={6}>
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
                                {this.state.searching ? (
                                    <WaitSpinner size="medium" screenReaderText="waiting" />
                                ) : null}
                                {'            '}
                                <Button
                                    label="Execute Search"
                                    inline
                                    disabled={this.state.searching}
                                    appearance="primary"
                                    onClick={this.handleSearch}
                                />
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={4}></ColumnLayout.Column>
                        </ColumnLayout.Row>
                    </CollapsiblePanel>
                </ColumnLayout>
                <TabLayout defaultActivePanelId="platform">
                    <TabLayout.Panel label="Data Results" panelId="platform">
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
                                            // ellipsis: {
                                            //     width: 120,
                                            //     textOverflow: 'ellipsis',
                                            // },
                                            // 'break-word': {
                                            //     width: 120,
                                            //     textOverflow: 'break-word',
                                            // },
                                            // anywhere: {
                                            //     width: 120,
                                            //     textOverflow: 'anywhere',
                                            // },
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

export default CaseDemo1;
