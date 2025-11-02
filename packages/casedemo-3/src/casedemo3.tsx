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
import caseflow from './static/caseflow3.png';
import MessageBar from '@splunk/react-ui/MessageBar';

class CaseDemo3 extends Component {
    constructor(props: {}) {
        super(props);
        this.state = {
            search: `| inputlookup uc3_notables.csv
| eval event=rule_name."-".description
| fields event
| llmrag prompt="Based on historical response records, identify which department or role is primarily responsible for handling this type of security event {event}. Respond in JSON with fields 'responsible_department' and 'reasoning'." provider=ollama model=llama3:latest`,
            search2: `| inputlookup uc3_notables.csv`,
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
        const description = `To address the current complexity of using DSDL with Vector DB and LLM workflows, we provide another option to customer to have a more implementable solution that relies solely on Splunk commands or MLTK native capabilities to achieve vector search + LLM application scenarios.

        Sample Scenarios:

- Automated historical similar event supplementation via Playbook
- FAQ-based Q&A for security incidents`;

        const search = `| inputlookup uc3_notables.csv
| eval event=rule_name."-".description
| fields event
| llmrag prompt="Based on historical response records, identify which department or role is primarily responsible for handling this type of security event {event}. Respond in JSON with fields 'responsible_department' and 'reasoning'." provider=ollama model=llama3:latest`;

        const comments = `// get Notable details
// combine rule information and notable information in one field
//
// Customized command to query vector DB to add internal information
`;

        const usecaseflow = `
## The specific steps of this use case are as follows:
1. Get Security Notable: Retrieve security notable information from Splunk by SPL
1. Use Custom search command to enrich the notable event from internal & private information in Vector DB.

Splunk Implementation:
- Custom search command (llmrag) to invoke vector database retrieval;
- Utilize MLTK methods like fit and apply for text preprocessing, automatically feeding results to LLM for summarization/analysis;
- Establish an "queryable and searchable" knowledge cascade layer, such as analyzing historical cases of similar attack patterns.
`;

        const Prerequisites = `- Must have [AI Toolkit](https://docs.splunk.com/Documentation/MLApp/5.6.3/User/AboutMLTK) installed
- Must have local Vector DB deployed
- Must have custom command to connect to local Vector DB (varies according to your Vector DB, there is an example in current app)
- Must have Python env  properly configured for custom command (configured in $SPLUNK_HOME/etc/apps/ai-samples/bin/system_python.path) Please replace with your own python with lib

Sample Env setup for this case
* Install milvus
    * Standalone or docker unless the service port is 19530
* Create python env
    * cd $SPLUNK_HOME/etc/apps/AI_Essentials
    * python3.11 -m venv milvus_venv
    * source milvus_venv/bin/activate
* Import required package
    * pip install --upgrade pip
    * pip install pymilvus sentence-transformers requests splunk-sdk ollama
* embedding doc
    * cd $SPLUNK_HOME/etc/apps/AI_Essentials/bin
    * python milvus_embed.py
    * python milvus_test.py
`;


        // @ts-ignore
        return (
            <SplunkThemeProvider family="prisma" colorScheme="light" density="comfortable">
                <StyledContainer style={{ width: '100%' }}>
                    <Heading level={1}>Vector search and LLM analysis pipeline design</Heading>
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
                                <Chip appearance="info">RAG</Chip>
                                <Chip appearance="success">Vector DB</Chip>
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
                            <ColumnLayout.Column span={5}>
                                <Markdown text={usecaseflow} />
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={7}>
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
                <TabLayout activePanelId={this.state.activepanal}  onChange={tabChange}>
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
                                            answer: {
                                                width: 150,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("answer") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("answer") | pick(columnColor)',
                                            },
                                            department: {
                                                width: 150,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("department") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("department") | pick(columnColor)',
                                            },
                                            contact: {
                                                width: 150,
                                                rowBackgroundColors:
                                                    '> table | seriesByName("contact") | pick(columnBackgroundColor)',
                                                rowColors:
                                                    '> table | seriesByName("contact") | pick(columnColor)',
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

export default CaseDemo3;
