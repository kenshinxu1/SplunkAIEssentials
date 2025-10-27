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
import MessageBar from '@splunk/react-ui/MessageBar';
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
            search: `| inputlookup uc1_es_notables.csv
| ai prompt="From this event record, identify which IOC types are present. Choose from [file_hash, ip, domain, url, email_address]. Output a comma-separated list of detected IOC types. Event details: {rule_name}, {description}, hash={file_hash}, ip={dest}, domain={domain}, url={url}, email={email_from}." provider=Ollama model=hf.co/DevQuasar/fdtn-ai.Foundation-Sec-8B-Instruct-GGUF:Q4_K_M
| eval ioc_type=trim(ai_result_1)
| lookup uc1_ioc_prompt_map.csv ioc_type OUTPUT prompt_template
| eval prompt=prompt_template
| foreach file_hash src dest domain url email_from user [
    eval prompt=replace(prompt, "{<<FIELD>>}", coalesce('<<FIELD>>',""))
]
| ai prompt="{prompt}" provider=Ollama model=hf.co/DevQuasar/fdtn-ai.Foundation-Sec-8B-Instruct-GGUF:Q4_K_M
| table rule_name prompt ai_*`,
            search2: `| inputlookup uc1_es_notables.csv`,
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

        const tabChange = (e,value:any) => {
            console.log(value);
            this.setState({activepanal: value.activePanelId });
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


        const description = `   Analysis of common IOCs (Indicators of Compromise, such as domains, IPs, file hashes, URLs, etc.) using large language model-assisted analysis to enhance traditional rule-based matching and threat intelligence citation methods:

- Categorize scenarios based on the CIM data model (e.g., Endpoint, Network, Email, Web, etc.).
- Automatically invoke LLM for auxiliary analysis when each IOC is detected, such as:
    1. Determine whether a domain appears to have phishing characteristics (based on structure, keywords, historical reputation, etc.).
    1. Summarizing known threat intelligence about file hashes (e.g., VirusTotal result summaries, MITRE ATT&CK relevance).
    1. Analyze whether the URL path structure exhibits suspicious patterns.
- Embed IOCs in context (correlating user behavior, traffic, geolocation) for LLM to assess anomaly severity.`

        const search = `| inputlookup uc1_es_notables.csv
| ai prompt="From this event record, identify which IOC types are present. Choose from [file_hash, ip, domain, url, email_address]. Output a comma-separated list of detected IOC types. Event details: {rule_name}, {description}, hash={file_hash}, ip={dest}, domain={domain}, url={url}, email={email_from}." provider=Ollama model=hf.co/DevQuasar/fdtn-ai.Foundation-Sec-8B-Instruct-GGUF:Q4_K_M
| eval ioc_type=trim(ai_result_1)
| lookup uc1_ioc_prompt_map.csv ioc_type OUTPUT prompt_template
| eval prompt=prompt_template
| foreach file_hash src dest domain url email_from user [
    eval prompt=replace(prompt, "{<<FIELD>>}", coalesce('<<FIELD>>',""))
]
| ai prompt="{prompt}" provider=Ollama model=hf.co/DevQuasar/fdtn-ai.Foundation-Sec-8B-Instruct-GGUF:Q4_K_M
| table rule_name prompt ai_*`;

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

        const Prerequisites =`-  Must have [AI Toolkit](https://docs.splunk.com/Documentation/MLApp/5.6.3/User/AboutMLTK) installed
- Must have LLM connection  configured Properly in AI Toolkit
- Must have Security model hf.co/DevQuasar/fdtn-ai.Foundation-Sec-8B-Instruct-GGUF:Q4_K_M is installed (or you need to adjust the prompt base on your own model)
- The lookup table for IOC indicator is configured (optional)`;
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
                            <Markdown  style={{"max-width":1000}}  text={description} />
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
                        <Markdown style={{"max-width":1000}} text={Prerequisites} />
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
                                <Button
                                    label="Execute Search"
                                    inline
                                    disabled={this.state.searching}
                                    appearance="primary"
                                    onClick={this.handleAISearch}
                                />
                                {'     '}
                                {this.state.searching ?  <Button disabled label="Loading" appearance="subtle" /> : null}
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
                <TabLayout activePanelId={this.state.activepanal} onChange={tabChange}>
                    <TabLayout.Panel label="Original Data" panelId="original"  >
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
                    <TabLayout.Panel label="AI Results" panelId="aidata">
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
                                                width: 100,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnColor)',
                                            },
                                            ai_result_2: {
                                                width: 500,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("ai_result_2") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("ai_result_2") | pick(columnColor)',
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
