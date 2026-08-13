
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { PopoverModule } from 'primeng/popover';
import { ListboxModule } from 'primeng/listbox';
import { PanelModule } from 'primeng/panel';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePickerModule } from 'primeng/datepicker';
import { DataViewModule } from 'primeng/dataview';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TabsModule } from 'primeng/tabs';
import {  SelectButtonModule } from 'primeng/selectbutton';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';
import { StepperModule } from 'primeng/stepper';
import { FluidModule } from 'primeng/fluid';



const ANGULAR_MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule
];

const PRIMENG_MODULES = [
  FluidModule,
  FieldsetModule,
  SkeletonModule,
  SelectButtonModule,
  AutoCompleteModule,
  ButtonModule,
  InputTextModule,
  TableModule,
  ToastModule,
  TooltipModule,
  SelectModule,
  MenuModule,
  MenubarModule,
  BreadcrumbModule,
  PopoverModule,
  PanelModule,
  ListboxModule,
  AvatarModule,
  AvatarGroupModule,
  ToggleButtonModule,
  IconFieldModule,
  InputIconModule,
  DatePickerModule,
  DataViewModule,
  CardModule,
  ChartModule,
  TabsModule,
  PasswordModule,
  MessageModule,
  InputNumberModule,
  DividerModule,
  DynamicDialogModule,
  ConfirmDialogModule,
  CheckboxModule,
  AccordionModule,
  TagModule,
  StepperModule
];

@NgModule({
  imports: [
    ...ANGULAR_MODULES,
    ...PRIMENG_MODULES,
  ],
  exports: [
    ...ANGULAR_MODULES,
    ...PRIMENG_MODULES,
  ]
})
export class KShareModule { }