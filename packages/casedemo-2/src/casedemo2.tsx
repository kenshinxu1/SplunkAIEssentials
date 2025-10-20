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
import caseflow from './static/caseflow2.png';
import MessageBar from '@splunk/react-ui/MessageBar';

class CaseDemo2 extends Component {
    constructor(props: {}) {
        super(props);
        this.state = {
            search: `| inputlookup uc2_risk_notables.csv
| stats list(rba_id) as rbas, list(risk_object) as risk_objects, list(threat_objects) as threat_objects, list(rule_name) as rules, list(description) as descs
| eval rba_data=""
| foreach rbas risk_objects threat_objects rules descs
    [ eval rba_data = rba_data . "<<FIELD>>: " . mvindex('<<FIELD>>', 0) . " | " ]
| eval all_rba_info = mvzip(mvzip(mvzip(mvzip(rbas, risk_objects, "::"), threat_objects, "::"), rules, "::"), descs, "::")
| eval event_info = mvjoin(all_rba_info, "\\n")
| eval text="以下安全事件是否可能是同一攻击者发起的攻击链的不同阶段？"
| eval source_lang="Chinese"
| eval target_lang="English"
| ai prompt="Translate from {source_lang} into {target_lang}:{text}" provider=Ollama model=aya:8b-23
| ai prompt="You are an experienced security analyst. Please analyze the security incidents {event_info} according to the instructions {ai_result_1}. Return structured JSON result with groupings and reasoning." provider=Ollama model=hf.co/DevQuasar/fdtn-ai.Foundation-Sec-8B-Instruct-GGUF:Q4_K_M
| ai prompt="Use the following grouped RBA analysis results to generate a concise threat summary report in English, highlighting key attack activities, involved assets, and recommendations. Grouped Data: {ai_result_2}" provider=Ollama model=llama3:latest
| ai prompt="Translate from {source_lang} into {target_lang}:{ai_result_3}" provider=Ollama model=aya:8b-23
| table all_rba_info ai_result_*`,
            search2: `| inputlookup uc2_risk_notables.csv `,
            searching: false,
            error: null,
            collaps1: true,
            collaps2: true,
            collaps3: true,
            activepanal: 'original',
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

        const description =`

Different LLMs have distinct applicable scenarios. By introducing LLMs with varying capabilities and focuses, model collaboration and role specialization can achieve more security-aligned intelligent analysis and interactive experiences.

During alert analysis period:
- Model A translates user requirements → Model B performs security analysis → Model C generates incident summary reports
- Supports cross-model communication across teams with different input languages and contexts
- Integrate multiple models into Splunk via streaming commands to enable model routing and task scheduling, then output to ES (Elasticsearch) + SOAR for automated response.`;

        const search = `| inputlookup uc2_risk_notables.csv
| stats list(rba_id) as rbas, list(risk_object) as risk_objects, list(threat_objects) as threat_objects, list(rule_name) as rules, list(description) as descs
| eval rba_data=""
| foreach rbas risk_objects threat_objects rules descs
    [ eval rba_data = rba_data . "<<FIELD>>: " . mvindex('<<FIELD>>', 0) . " | " ]
| eval all_rba_info = mvzip(mvzip(mvzip(mvzip(rbas, risk_objects, "::"), threat_objects, "::"), rules, "::"), descs, "::")
| eval event_info = mvjoin(all_rba_info, "\\n")
| eval text="以下安全事件是否可能是同一攻击者发起的攻击链的不同阶段？"
| eval source_lang="Chinese"
| eval target_lang="English"
| ai prompt="Translate from {source_lang} into {target_lang}:{text}" provider=Ollama model=aya:8b-23
| ai prompt="You are an experienced security analyst. Please analyze the security incidents {event_info} according to the instructions {ai_result_1}. Return structured JSON result with groupings and reasoning." provider=Ollama model=foundation8b:latest
| ai prompt="Use the following grouped RBA analysis results to generate a concise threat summary report in English, highlighting key attack activities, involved assets, and recommendations. Grouped Data: {ai_result_2}" provider=Ollama model=llama3:latest
| ai prompt="Translate from {source_lang} into {target_lang}:{ai_result_3}" provider=Ollama model=aya:8b-23
| table all_rba_info ai_result_*`;

        const comments = `// Load security event data like RBA IDs, risk objects, threat objects, etc.
// Aggregates data into multivalue fields for cross-referencing and analysis
//
// For each field, it appends the field name and its first value (mvindex('<<FIELD>>', 0)) to rba_data
// Combines all multivalue fields into a single zipped field
// Joins the zipped data into a single string with newline separators.
// Defines the prompt for later AI translation/analysis.
// Sets variables for language translation (Chinese → English).
// Uses AI (Ollama with aya:8b-23 model) to translate the Chinese prompt to English.
// Asks an AI (foundation8b) to analyze the events (event_info) and group them into potential attack chains
// Generates a readable report from the AI analysis (ai_result_2).
// Translates the final report (ai_result_3) back to Chinese .
// Displays the final results in a table
`;

        const usecaseflow = `
## The specific steps of this use case are as follows:
Data Preparation: Load and structure event data.
AI Translation: Convert Chinese prompts to English.
AI Analysis: Group events into attack chains.
Reporting: Generate actionable insights.
Final Output: Display raw and analyzed data.

model role allocation:
- Model A (e.g., Tongyi Qianwen or Doubao): Primarily handles Chinese comprehension and interaction, addressing local team requirements or analytical descriptions.
- Model B (e.g., Security-specialized Foundation 8B): Focuses on security threat deconstruction and attack chain analysis.
- Model C (e.g., OpenAI GPT series): Provides structured summarization, cross-domain language processing, and scenario integration capabilities.
`;
        const Prerequisites =`- [AI Toolkit](https://docs.splunk.com/Documentation/MLApp/5.6.3/User/AboutMLTK) is installed
- multi LLM models for different scenarios are available
- Connections with multi Models are configured properly in AI Toolkit`;

        // @ts-ignore
        return (
            <SplunkThemeProvider family="prisma" colorScheme="light" density="comfortable">
                <StyledContainer style={{ width: '100%' }}>
                    <Heading level={1}>Multi-model collaborative composite AI scenarios</Heading>
                </StyledContainer>
                <ColumnLayout>
                    <ColumnLayout.Row>
                        <ColumnLayout.Column style={colStyle} span={7}>
                            <Heading level={2}>Description</Heading>
                            <br />
                            <Markdown style={{"max-width":1000}}  text={description} />
                        </ColumnLayout.Column>
                        <ColumnLayout.Column style={colStyle} span={5}>
                            <Heading level={2}>Category</Heading>
                            <br />
                            <Layout>
                                <Chip appearance="info">LLM</Chip>
                                <Chip appearance="success">Translation</Chip>
                                <Chip appearance="warning">Security</Chip>
                                <Chip appearance="success">Multi Models</Chip>
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
                            <ColumnLayout.Column span={4}>
                                <Markdown text={usecaseflow} />
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={8}>
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
                    <TabLayout.Panel label="Original Data" panelId="original">
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
                                                width: 150,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnColor)',
                                            },
                                            ai_result_2: {
                                                width: 200,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnColor)',
                                            },
                                            ai_result_3: {
                                                width: 200,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("ai_result_1") | pick(columnColor)',
                                            },
                                            ai_result_4: {
                                                width: 200,
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

export default CaseDemo2;
