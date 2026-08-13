# Sign Up & School Onboarding

## Tech Stacks && note*
1. Use Angular + PrimeNg v19 (Meterial vibe/preset) + PrimeFlex
2. Try to use PrimeFlex style instead scss
3. we not yet have api, so:
    - create needed services in D:\Project_Learning\school-management\school-management-webapp\src\app\core\services
    - process CRUD with localstorage, but make it easy to change to use API later also

## Flow

Landing Website: D:\Project_Learning\school-management\school-management-website
-> Sign Up add url to route into webApp or Sign Up & School Onboarding
-> Choose Plan
-> School Setup
-> Add School
-> Add Branch
-> Academic Structure
-> Done
-> Dashboard

## Sign Up

- Name
- Email
- Password
- Confirm Password

## Choose Plan

- Starter
- Professional
- Enterprise

## School Setup

Progress: 
`01 School -> 02 Branch -> 03 Academic`
    1. use <p-stepper> and primeFlex animation also
    2. 01 School Design p-select school type as Hightling or Active Note* style becuase it will effect to system menu struture
    

Do not add a Review step.

Final action:
`Done`

After Done:
`Dashboard`
- create simple Dashboard componet just for route to and we will improve its detail with the menu layout later 

Do not create a separate School Admin step. The account owner becomes the initial owner/admin automatically.
