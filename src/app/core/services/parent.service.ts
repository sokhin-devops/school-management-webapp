import { Injectable, signal } from '@angular/core';
import { Person, PersonType, Status } from '../models';
import { removeById, upsertById } from '../utils/collection';

/** Parent/guardian row for People > Parents, denormalized with the linked children's names. */
export interface ParentRecord extends Person {
  children: string[];
  relationship: string;
}

function parent(
  id: string,
  firstName: string,
  lastName: string,
  relationship: string,
  children: string[],
  email: string,
  phone: string,
  status: Status = Status.Active,
): ParentRecord {
  return {
    id,
    branchIds: ['branch-1'],
    type: PersonType.Parent,
    firstName,
    lastName,
    email,
    phone,
    status,
    relationship,
    children,
    parentDetails: {
      studentPersonIds: children.map((child) => child.toLowerCase().replace(/\s+/g, '-')),
    },
  };
}

function seedParents(): ParentRecord[] {
  return [
    parent('par-001', 'Michael', 'Carter', 'Father', ['Aiden Carter'], 'michael.carter@mail.com', '+1 555-030-3001'),
    parent('par-002', 'Linh', 'Nguyen', 'Mother', ['Sophia Nguyen'], 'linh.nguyen@mail.com', '+1 555-030-3002'),
    parent('par-003', 'Patricia', 'Johnson', 'Mother', ['Liam Johnson'], 'patricia.johnson@mail.com', '+1 555-030-3003'),
    parent('par-004', 'Carlos', 'Martinez', 'Father', ['Olivia Martinez'], 'carlos.martinez@mail.com', '+1 555-030-3004'),
    parent('par-005', 'Sandra', 'Williams', 'Mother', ['Noah Williams'], 'sandra.williams@mail.com', '+1 555-030-3005'),
    parent('par-006', 'Gregory', 'Brown', 'Father', ['Emma Brown'], 'gregory.brown@mail.com', '+1 555-030-3006', Status.Inactive),
    parent('par-007', 'Yolanda', 'Davis', 'Guardian', ['Elijah Davis'], 'yolanda.davis@mail.com', '+1 555-030-3007'),
    parent('par-008', 'Ana', 'Garcia', 'Mother', ['Ava Garcia'], 'ana.garcia@mail.com', '+1 555-030-3008'),
    parent('par-009', 'Ruben', 'Rodriguez', 'Father', ['Lucas Rodriguez'], 'ruben.rodriguez@mail.com', '+1 555-030-3009'),
    parent('par-010', 'Elena', 'Hernandez', 'Mother', ['Mia Hernandez'], 'elena.hernandez@mail.com', '+1 555-030-3010'),
    parent('par-011', 'Victor', 'Lopez', 'Father', ['Mason Lopez', 'Isabella Gonzalez'], 'victor.lopez@mail.com', '+1 555-030-3011'),
    parent('par-012', 'Beatrice', 'Wilson', 'Mother', ['Ethan Wilson'], 'beatrice.wilson@mail.com', '+1 555-030-3012'),
  ];
}

@Injectable({ providedIn: 'root' })
export class ParentService {
  private readonly _parents = signal<ParentRecord[]>(seedParents());
  readonly parents = this._parents.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: ParentRecord): void {
    this._parents.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._parents.update((current) => removeById(current, id));
  }
}
