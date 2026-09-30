-- OPTIONAL competition/dev seed. Run manually after all migrations in filename order.
-- Do not run in production. No auth users or business memberships are created.
-- To view seeded private demand/request data, an administrator must explicitly
-- add a real registered user as a member of the relevant seeded business.

insert into public.businesses (id,name,slug,description,business_type,primary_industry,location_city,location_province,verification_status,years_operating) values
('10000000-0000-4000-8000-000000000001','NusaTech Industries','nusatech-industries-seed','Industrial component manufacturing and product assembly.','Industrial Components','Manufacturing','Jakarta','DKI Jakarta','verified',9),
('10000000-0000-4000-8000-000000000002','Precision Works','precision-works-seed','CNC milling and turning for industrial production.','Contract manufacturer','Precision Engineering','Bekasi','West Java','verified',12),
('10000000-0000-4000-8000-000000000003','PackPro Indonesia','packpro-indonesia-seed','Flexible packaging and production support.','Packaging provider','Packaging','Tangerang','Banten','verified',8),
('10000000-0000-4000-8000-000000000004','Nusantara Plastics','nusantara-plastics-seed','Injection molded components and housings.','Contract manufacturer','Plastic Manufacturing','Tangerang','Banten','verified',11),
('10000000-0000-4000-8000-000000000005','ProtoLab','protolab-seed','Rapid prototyping and small-batch 3D printing.','Prototyping studio','3D Printing','Bandung','West Java','unverified',5)
on conflict (id) do nothing;

insert into public.capacity_listings (id,business_id,title,category,description,location_city,location_province,total_capacity,available_capacity,capacity_unit,minimum_order,lead_time_days,estimated_price_min,estimated_price_max,pricing_unit,availability_status,listing_status,supported_materials,machines_facilities,certifications) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','CNC Milling','CNC & Machining','Precision CNC milling for aluminum and steel industrial components.','Bekasi','West Java',10000,6500,'units',500,14,18000,25000,'unit','available_now','active',array['Aluminum','Mild steel','Stainless steel'],array['3-axis CNC milling machines','Precision inspection equipment'],array['ISO 9001']),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','Flexible Packaging','Packaging','Printed pouches and flexible packaging for repeat production.','Tangerang','Banten',50000,18000,'packages',2000,18,3200,5600,'package','within_7_days','active',array['PET','PE film'],array['Printing lines','Laminating line'],array['Quality Control Process']),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004','Injection Molding','Plastic Manufacturing','Consumer and industrial plastic components with material trials.','Tangerang','Banten',65000,25000,'units',2000,21,3500,8500,'unit','within_7_days','active',array['ABS','Polypropylene','HDPE'],array['Injection molding machines','Mold workshop'],array['Batch Traceability']),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000005','Industrial 3D Printing','3D Printing','Rapid prototypes and short production runs.','Bandung','West Java',3000,1200,'units',10,7,28000,65000,'unit','available_now','active',array['PLA','PETG','Nylon'],array['FDM printers','Finishing benches'],array[]::text[])
on conflict (id) do nothing;

insert into public.demands (id,business_id,title,category,capability,description,quantity,unit,demand_type,preferred_location,required_completion_date,preferred_lead_time_days,urgency,budget_min,budget_max,materials,status) values
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','NusaTech CNC Components','CNC & Machining','CNC Milling','Machined aluminum components for an industrial assembly order.',5000,'units','one-time','Jakarta',current_date + 21,21,'priority',90000000,110000000,array['Aluminum'],'open')
on conflict (id) do nothing;

insert into public.capacity_requests (id,buyer_business_id,provider_business_id,capacity_listing_id,demand_id,requested_capability,category,quantity,unit,production_location,preferred_start_date,required_completion_date,budget,budget_flexibility,material,materials,product_description,status) values
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','CNC Milling','CNC & Machining',5000,'units','Jakarta',current_date + 3,current_date + 21,110000000,'slightly_flexible','Aluminum',array['Aluminum'],'Machined aluminum industrial components.','negotiation')
on conflict (id) do nothing;

insert into public.request_proposals (id,request_id,provider_business_id,quantity,unit,unit_price,production_start_date,estimated_completion_date,lead_time_days,provider_notes,status) values
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',5000,'units',21500,current_date + 3,current_date + 18,15,'Includes machining, in-process inspection, and batch delivery.','pending')
on conflict (id) do nothing;
