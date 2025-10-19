import React from 'react';
// @ts-ignore
import Table from '@splunk/visualizations/Table';


    const Datatable = (field: any) => (
        <Table
            context={{
                numberFormat: {
                    number: {
                        thousandSeparated: true,
                        unitPosition: 'after',
                        output: 'byte',
                        base: 'binary',
                        spaceSeparated: true,
                        precision: 4,
                    },
                },
                timeFormat: {
                    time: {
                        format: 'MM-DD-YYYY [at] hh:mm A',
                    },
                },
            }}
            options={{
                columnFormat: {
                    number1: {
                        data: '> table | seriesByName("number1") | formatByType(numberFormat)',
                    },
                    time: {
                        data: '> table | seriesByName("time") | formatByType(timeFormat)',
                    },
                },
            }}
            // dataSources={data}
            dataSources={{
                primary: {
                    requestParams: { offset: 0, count: 20 },
                    // data: datas,
                    data: {
                        fields: field,
                        columns: [
                            ['2000', '10000000', '13', '60', { data: 'time' }],
                            [
                                '2018-05-02T18:10:46.000-07:00',
                                '2018-05-02T18:11:47.000-07:00',
                                '2018-05-02T18:12:48.000-07:00',
                                '2018-05-02T18:13:49.000-07:00',
                                '2018-05-02T18:15:50.000-07:00',
                            ],
                        ],
                    },
                    meta: { totalCount: 100 },
                },
            }}
        />
    );

export default Datatable;
