import { Component, OnInit, ChangeDetectionStrategy  } from '@angular/core';
import { CallTransactionService, SearchCallService} from './services';
import { Functions } from './helpers/functions';

import * as moment from 'moment';
import { CallReportService } from './services/call/report.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
    title = 'homer-view';
    loading = false;
    getParams: any;
    testdata: any;

    paramData: any;
    isMessage = false;
    messageData = null;
    constructor(
        private searchCallService: SearchCallService,
        private callTransactionService: CallTransactionService,
        private callReportService: CallReportService,
        private cdr: ChangeDetectorRef
    ) {
        this.getParams = Functions.getUriParams();
        console.log({getParams: this.getParams});
        this.paramData = {
            id: this.getParams.callid || '',
            mouseEventData: 'item.mouseEventData',
            dataQOS: [],
            data: this.testdata,
            loaded: false
        };
    }
    ngOnInit() {
        // this.testdata = await this.getDataTransaction();
        // const windowData = this.paramData;
        // this.paramData = {
        //     id: this.getParams.callid || '',
        //     mouseEventData: 'item.mouseEventData',
        //     data: this.testdata,
        //     loaded: true
        // };


        this.loading = false;
        const readyToOpen = (data: any, dataQOS: any) => {
            if (!data || !dataQOS) {
                return;
            }
            this.testdata = data;

            this.paramData.loaded = true;
            this.paramData.data = data;
            this.paramData.dataQOS = dataQOS;
            this.paramData.snapShotTimeRange = {
                from: this.getParams.from,
                to: this.getParams.to
            };
            this.cdr.detectChanges();
        };
        let localDataQOS: any = null;
        let localData: any = null;

        this.callReportService.postQOS(this.getQuery(true)).toPromise().then(dataQOS => {
            localDataQOS = dataQOS;
            readyToOpen(localData, localDataQOS);
        });

        this.callTransactionService.getTransaction(this.getQuery()).toPromise().then(data => {
            localData = data;
            readyToOpen(localData, localDataQOS);
        });
    }

    getQuery(isQOS = false) {
        const localData = {
            protocol_id: this.getParams.protocol_id || '1_call'
        };

        const correlation_id = this.getParams.corrid || '';

        const search = {};
        const query: any = {
            param: {
                transaction: {},
                search: {
                    1_call: [{
                        name: "protocol_header.correlation_id",
                        value: correlation_id,
                        func: null,
                        type: "string",
                        hepid: 1
                    }]
                },
                location: {},
                timezone: {
                    value: -180,
                    name: 'Local'
                }
            },
            timestamp: {
                // 24h back
                from: this.getParams.from * 1 || (Date.now() - (24 * 3600 * 1000)),
                to: this.getParams.to * 1 || Date.now()
            }
        };
        if (isQOS) {
            query.param.id = {};
        } else {
            query.param.limit = this.getParams.limit || 200;
        }
        return query;
    }

    addWindowMessage(row, mouseEventData = null) {
        const localData = {
            protocol_id: row.data.profile || '1_call'
        };
        if (row.data.profile === '' && row.data.proto === 'rtcp' && row.data.payloadType === 5) {
            localData.protocol_id = '5_default';
        }
        const color = Functions.getColorByString(row.data.method || 'LOG');
        const mData = {
            loaded: false,
            data: null,
            id: row.data.id * 1,
            headerColor: color || '',
            mouseEventData: mouseEventData || row.data.mouseEventData,
            isBrowserWindow: row.isBrowserWindow
        };
        if (row.isLog) {
            const data = row.data.item;
            mData.data = data;
            mData.data.item = {
                raw: mData.data.raw
            };
            mData.data.messageDetaiTableData = Object.keys(mData.data)
                .map(i => {
                    let val;
                    if (i === 'create_date') {
                        val = moment(mData.data[i]).format('DD-MM-YYYY');
                    } else if (i === 'timeSeconds') {
                        val = moment( mData.data[i]).format('hh:mm:ss.SSS');
                    } else {
                        val = mData.data[i];
                    }
                    return {name: i, value: val};
                })
                .filter(i => typeof i.value !== 'object' && i.name !== 'raw');
            mData.loaded = true;
            this.isMessage = mData.loaded;
            this.messageData = mData.data;
            // this.arrMessageDetail.push(mData);
            this.cdr.detectChanges();

            return;
        }
        const request = {
            param: {
                transaction: {},
                limit: 200,
                search: {},
                location: {},
                timezone: {
                    value: -180,
                    name: 'Local'
                }
            },
            timestamp: {
                from: this.getParams.from * 1 || 1574632800000,
                to: this.getParams.to * 1 || 1577224799000
            }
        };

        request.param.limit = 1;
        request.param.search[localData.protocol_id] = { id: row.data.id * 1 };
        request.param.transaction = {
            call: localData.protocol_id.match('call'),
            registration: localData.protocol_id.match('registration'),
            rest: localData.protocol_id.match('default')
        };
        // this.arrMessageDetail.push(mData);
        this.isMessage = mData.loaded;
        this.messageData = mData.data;
        const getMessageSubscription = this.searchCallService.getMessage(request).subscribe(data => {
            getMessageSubscription.unsubscribe();
            mData.data = data.data[0];
            mData.data.item = {
                raw: mData.data.raw
            };
            mData.data.messageDetaiTableData = Object.keys(mData.data)
                .map(i => {
                    let val;
                    if (i === 'create_date') {
                        val = moment(mData.data[i]).format('DD-MM-YYYY');
                    } else if (i === 'timeSeconds') {
                        val = moment( mData.data[i]).format('hh:mm:ss.SSS');
                    } else {
                        val = mData.data[i];
                    }
                    return {name: i, value: val};
                })
                .filter(i => typeof i.value !== 'object' && i.name !== 'raw');
            mData.loaded = true;
            this.isMessage = mData.loaded;
            this.messageData = mData.data;
            this.cdr.detectChanges();
        });
    }

}
