---
layout: paper.hbs
subtitle: A Comparison of Texture Models for Automatic Liver Segmentation
title: A Comparison of Texture Models for Automatic Liver Segmentation
published:
  - name: SPIE Medical Imaging 2007
    files:
      - name: PDF
        link: /static/papers/SPIE07_SusomboonMailanTim-Final.pdf
authors:
  - name: Mailan Pham
    link: #
  - name: Ruchaneewan Susomboon
    link: http://www.informatik.uni-trier.de/~ley/db/indices/a-tree/s/Susomboon:Ruchaneewan.html
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Daniela Raicu
    link: http://facweb.cs.depaul.edu/Dstan/
  - name: Jacob Furst
    link: http://www.cdm.depaul.edu/people/pages/facultyinfo.aspx?fid=365
---
Automatic liver segmentation from abdominal computed tomography (CT) images based on gray levels or shape alone is
difficult because of the overlap in gray-level ranges and the variation in position and shape of the soft tissues. To address
these issues, we propose an automatic liver segmentation method that utilizes low-level features based on texture
information; this texture information is expected to be homogenous and consistent across multiple slices for the same organ.
Our proposed approach consists of the following steps, first, we perform pixel-level texture extraction; second, we generate
liver probability images using a binary classification approach; third, we apply a split-and-merge algorithm to detect the seed
set with the highest probability area; and fourth, we apply to the seed set a region growing algorithm iteratively to refine the
liver’s boundary and get the final segmentation results. Furthermore, we compare the segmentation results from three
different texture extraction methods (Co-occurrence Matrices, Gabor filters, and Markov Random Fields (MRF)) to find the
texture method that generates the best liver segmentation. From our experimental results, we found that the co-occurrence
model led to the best segmentation, while the Gabor model led to the worst liver segmentation. Moreover, co-occurrence
texture features alone produced approximately the same segmentation results as those produced when all the texture features
from the combined co-occurrence, Gabor, and MRF models were used. Therefore, in addition to providing an automatic
model for liver segmentation, we also conclude that Haralick co-occurrence texture features are the most significant texture
characteristics in distinguishing the liver tissue in CT scans.
