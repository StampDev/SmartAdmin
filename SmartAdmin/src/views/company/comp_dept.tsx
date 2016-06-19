﻿// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX



import React = require('react');
import ReactDOM = require('react-dom');
import jx = require('../../lib/jx');

import rb = require('react-bootstrap');
var b: any = rb;


import { Views, Types } from '../../lib/jx';


enum ReloadState { none, reloading, has_reloaded }

export interface CompDepartmentProps extends Views.ReactProps {
    div_id: string,
    dept_id?: string,
    reload?: boolean
}
export interface CompDepartmentState extends Views.ReactState {
    dept_id: string
}
export class CompDepartment extends Views.ReactView {

    constructor(props: CompDepartmentProps) {
        super(props);

        this.state.loading = true;
        this.state.dept_id = this.props.dept_id;

        this.reload_state = ReloadState.none;
    
    }

    div_obj: any;
    item: any;
    props: CompDepartmentProps;
    state: CompDepartmentState;
    
    reload_state: ReloadState;


    render() {

        this.state.dept_id = this.props.dept_id;

        var that = this;

        var title = 'Add new department';
        var icon = <i className="fa fa-plus-circle"></i>;

        if (!this.isNew) {
            title = 'Edit department';
            icon = <i className="fa fa-edit"></i>;
        }


        var html =
            <div className="col-lg-12 animated fadeInRight" style={{ padding: 0 }}>
                
                <jx.controls.BoxPanel title={title} box_color="blueLight" icon={icon} >                    
                    
                    <form>

                        <b.FormGroup controlId="formControlsText">
                            <jx.controls.BigLabel label="Department title" />
                            <b.FormControl type="text" data-bind="textInput:compdept_title" placeholder="Enter a title" />                            
                        </b.FormGroup>

                        <b.FormGroup controlId="formControlsText">
                            <jx.controls.BigLabel label="Department description" />
                            <textarea rows={3} id="compdept_descr" data-bind="textInput:compdept_descr" className="custom-scroll form-control" />
                        </b.FormGroup>

                        <br />

                        <button type="button" className="btn btn-danger pull-right btn-cancel" onClick={() => { that.cancel() } } style={{ marginLeft: 10 }}><i className="fa fa-times"></i> Cancel</button>
                        <button type="button" className="btn btn-primary pull-right btn-save" onClick={() => { that.save() } }><i className="fa fa-check"></i> Save</button>

                        <br/>

                    </form>
                </jx.controls.BoxPanel>

            </div>;

        return html;
    }    


    get isNew(): boolean {
        return !this.state.dept_id;

    }


    componentDidMount() {

        ko.cleanNode(this.root[0]);

        this.load_data().then(() => {

            ko.applyBindings(this.item, this.root[0]);
        });
    }


    componentDidUpdate() {


    }



    //componentDidMount() {
        
    //    if (this.state.loading) {

    //        ko.cleanNode(this.root[0]);

    //        this.reload_state = ReloadState.reloading;

    //        this.load_data().then(() => {
    //            this.reload_state = ReloadState.none;
    //            ko.applyBindings(this.item, this.root[0]);
    //        });
    //    }
    //}


    //componentDidUpdate() {

    //    if (this.reload_state === ReloadState.reloading) {
    //        this.reload_state = ReloadState.none;
    //        return;
    //    }
        
    //    ko.cleanNode(this.root[0]);

    //    this.reload_state = ReloadState.reloading;

    //    this.load_data().then(() => {

    //        this.reload_state = ReloadState.none;

    //        ko.applyBindings(this.item, this.root[0]);

    //    });        
    //}


    load_data() {

        utils.spin(this.root);

        var model = Backendless.Persistence.of('compdivs');

        var qry = new Backendless.DataQuery();

        qry.condition = "objectId = '{0}'".format(this.props.div_id);

        qry.options = { relations: ["depts"] };

        var that = this;

        var d = Q.defer();

        var that = this;

        model.find(qry, new Backendless.Async((res: any) => {

            this.div_obj = res.data[0];

            if (!that.isNew) {

                var dept = _.find(res.data[0].depts, dep => {
                    return dep['objectId'] === this.props.dept_id;
                });

                that.item = ko['mapping'].fromJS(dept);

            } else {

                var obj = _.extend(new CompDept(), {
                    ___class:'compdept',
                    compdivs_id: this.div_obj['objectId'],
                    compdept_title: '',
                    compdept_descr: ''
                });

                this.item = ko['mapping'].fromJS(obj);
                
            }
            
            utils.unspin(this.root);
            
            d.resolve(that.item);

        }));

        return d.promise;

    }


    save() {

        if (this.isNew) {

            this.add_new_div().then(() => {

                this.setState({
                    loading: true
                });
            });

        } else {

            this.save_div()
        }
    }


    save_div() {

        var obj = ko['mapping'].toJS(this.item);

        utils.spin(this.root);

        var model = Backendless.Persistence.of('compdept');


        model.save(obj, new Backendless.Async(res => {

            toastr.success('Data saved successfully');

            utils.unspin(this.root);

            this.props.owner.notify('update_list');

        }, err => {

            utils.unspin(this.root);

            toastr.error(err['message']);

        }));

    }


    add_new_div() {

        var model = Backendless.Persistence.of('compdivs');
        
        var obj = ko['mapping'].toJS(this.item);

        //obj['compdivs_id'] = this.props.div_id;       
        //obj['___class'] = 'compdept';

        obj['compdept_title'] = this.root.find('[data-bind="textInput:compdept_title"]').val();
        obj['compdept_descr'] = this.root.find('[data-bind="textInput:compdept_descr"]').val();

        this.div_obj['depts'].push(obj);

        var d = Q.defer();

        utils.spin(this.root);

        model.save(this.div_obj, new Backendless.Async(res => {

            toastr.success('Data saved successfully');

            this.state.dept_id = res['objectId'];

            utils.unspin(this.root);

            this.props.owner.notify('update_list');

            d.resolve(true);

        }, err => {

            utils.unspin(this.root);

            toastr.error(err['message']);

            d.reject(false);
        }));

        return d.promise;
    }


    cancel() {

        this.setState({
            loading: true
        });
    }
}

class CompDept {
    
    compdivs_id: string
    compdept_descr: string
    compdept_title: string
}