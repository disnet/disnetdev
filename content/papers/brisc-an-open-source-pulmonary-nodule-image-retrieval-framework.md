---
layout: paper.hbs
subtitle: BRISC - An Open Source Pulmonary Nodule Image Retrieval Framework
title: BRISC - An Open Source Pulmonary Nodule Image Retrieval Framework
date: 2007-01-01
published_year: 2007
published_how:
  - name: Journal of Digital Imaging 2007
    files:
      - name: PDF
        link: /static/papers/brisc_paper_final.pdf
authors:
  - name: Michael Lam
    link: http://freearrow.com/
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Daniela Raicu
    link: http://facweb.cs.depaul.edu/Dstan/
  - name: Jacob Furst
    link: http://www.cdm.depaul.edu/people/pages/facultyinfo.aspx?fid=365
  - name: David Channin
    link: http://www.informatik.uni-trier.de/~ley/db/indices/a-tree/c/Channin:David_S=.html
---

We have created a content-based image retrieval framework for computed tomography
images of pulmonary nodules. When presented with a nodule image,
the system retrieves images of similar nodules from a collection prepared by the Lung
Image Database Consortium (LIDC).

The system 1) extracts images of individual nodules from the LIDC collection based on LIDC expert annotations, 2) stores the extracted data in a flat XML database, 3) calculates a set of quantitative descriptors for each nodule that provide a high-level characterization of its texture, and 4) uses various measures to determine the similarity of two nodules and perform queries on a selected query nodule.

Using our framework, we compared three feature extraction methods, Haralick co-occurrence,
Gabor filters, and Markov random fields. Gabor and Markov descriptors perform better at retrieving similar
nodules than do Haralick co-occurrence techniques, with best retrieval precisions in excess of 88%.
Because the software we have developed and the reference images are both open source and
publicly available they may be incorporated into both commercial and academic
imaging workstations and extended by others in their research.
