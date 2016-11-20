---
layout: paper.hbs
subtitle: Content-Based Image Retrieval for Pulmonary Computed Tomography Nodule Images
title: Content-Based Image Retrieval for Pulmonary Computed Tomography Nodule Images
published:
  - name: SPIE Medical Imaging 2007
    files:
      - name: PDF
        link: /static/papers/SPIE_Lam_January21_2007.pdf
authors:
  - name: Michael Lam
    link: http://freearrow.com/
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Mailan Pham
    link: #
  - name: Daniela Raicu
    link: http://facweb.cs.depaul.edu/Dstan/
  - name: Jacob Furst
    link: http://www.cdm.depaul.edu/people/pages/facultyinfo.aspx?fid=365
  - name: Ruchaneewan Susomboon
    link: http://www.informatik.uni-trier.de/~ley/db/indices/a-tree/s/Susomboon:Ruchaneewan.html
---
Research studies have shown that advances in computed tomography (CT) technology allow better detection of
pulmonary nodules by generating higher-resolution images.  However, the new technology also generates many
more  individual  transversal  reconstructions,  which  as  a  result  may  aﬀect  the  eﬃciency  and  accuracy  of  the
radiologists interpreting these images.


The  goal  of  our  research  study  is  to  build  a  content-based  image  retrieval  (CBIR)  system  for  pulmonary
CT nodules.  Currently,  texture is used to quantify the image content,  but any other image feature could be
incorporated into the proposed system.  Unfortunately, there is no texture model or similarity measure known to
work best for encoding nodule texture properties or retrieving most similar nodules.  Therefore, we investigated
and evaluated several texture models and similarity measures with respect to nodule size, number of retrieved
nodules, and radiologist agreement on the nodules’ texture characteristic.


The  results  were  generated  on  90  thoracic  CT  scans  collected  by  the  Lung  Image  Database  Consortium
(LIDC).  Every  case  was  annotated  by  up  to  four  radiologists  marking  the  contour  of  nodules  and  assigning
nine  characteristics  (including  texture)  to  each  identiﬁed  nodule.   We  found  that  Gabor  texture  descriptors
produce the best retrieval results regardless of the nodule size, number of retrieved items or similarity metric.
Furthermore, when analyzing the radiologists’ agreement on the texture characteristic, we found that when just
two radiologists agreed, the average precision increased from 88% to 96% for both Gabor and Markov texture
features.  Moreover, once three or four radiologists agreed the precision increased to nearly 100%.
