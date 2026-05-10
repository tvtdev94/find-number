INSERT OR IGNORE INTO players (id,nickname,created_at,last_seen) VALUES
  ('p1','Alice',1,1),('p2','Bob',1,1),('p3','Cuong',1,1),('p4','Dao',1,1),('p5','Eve',1,1);
INSERT INTO matches (id,p1_id,p2_id,p1_nickname,p2_nickname,p1_score,p2_score,winner_id,ended_at,duration_ms) VALUES
  ('m1','p1','p2','Alice','Bob',8,2,'p1',1778400000000,12000),
  ('m2','p1','p3','Alice','Cuong',7,3,'p1',1778400000000,12000),
  ('m3','p1','p4','Alice','Dao',6,4,'p1',1778400000000,12000),
  ('m4','p2','p3','Bob','Cuong',5,5,NULL,1778400000000,12000),
  ('m5','p2','p4','Bob','Dao',8,2,'p2',1778400000000,12000),
  ('m6','p3','p4','Cuong','Dao',9,1,'p3',1778400000000,12000),
  ('m7','p3','p5','Cuong','Eve',6,4,'p3',1778400000000,12000),
  ('m8','p4','p5','Dao','Eve',3,7,'p5',1778400000000,12000);
