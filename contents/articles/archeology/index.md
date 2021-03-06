---
title: Code archeology
author: pribluda
date: 2018-01-31
template: article.pug
lang: en
---

digging in my attic I found  stash of old CDRs from my student times. Back then I freelanced for small medical 
technology company and developed video archiving for cardiac catheterisation procedures  
 
<span class="more"></span>

Up to the 90s golden standard was 35mm chemical film (black and white of course) - and doctorl liked those for crisp image 
quality.  Unfortunately they too up a lot of place - one propcedure produced kind of tuna can with film -  and there was 
a lot of procedures ( busy doc could do some 1500-2000 in a year).  And thy had to be stored for a long time... And they got lost.
Add costs  for  chemical processing, dark room, dedicated personell -  and you will understand that nobody vas really
happy with this solution.

In 90ties [DICOM](https://www.dicomstandard.org/) was introduced, and suddently everybody needed everything digital.  And 
new x-Ray machine was pretty expensive -  so there was market for retrofitting existing  systems with digital imaging 
technology. We used UltraSparks (Ultra 1,  256 MB RAM, 4 GB hard disks),  viedograbber boards from 
[Parallax Graphics](http://www.jlw.com/~woolsey/www.parallaxgraphics.com/products/index.html) (boy, were they expesive!), 
1x CDR Burner (one of the first), some RS323 fixtures to start recordig where footswitch was pressed, some programming in C 
under Motif  -  here is your brand new image acquisition workstation (it makes DM 150000 please)


We had decent hardware for acquisition - and got realime recording - but we ran into  close time constraints.   Patient 
stays at the office for half an hour before transfer, and it is absolutely necessary to give recorded CD with him. Burning 
it at 1x Speed takes about 20 minutes - but we still had to prepare data in DICOM format. It uses loseless JPEG as 
compression method - and there was absolutely no hardware support in doing this (well, maybe there was but not in our budget 
constraints).  Solaris provided libraries, but execution times were some 150ms for 512x512x8 picture - absolutely inacceptable 


Assembly to the Rescure! After 3 works of hard work I finally produced this (and now try to figure out what it does;): 


```c++

! pointer to the source pixel
#define pixPtr %i0
! width of scan
#define scanWidth %i1
! height of scan
#define scanHeight %i2
!destination pointer 
#define outP %i3
! saved destination pointer to be able to determine how many bytes we have written
#define outPsave %l0
! pointer to the chewed huffman table
#define huffP %i4
! predictor value
#define pred %l1
! predictor value for the first pixel in the row ( next )
#define predFirst %l3
! nice work variables to know how muchwork we have to do ...
! nothe , that we can use amount of rows in place
#define pix2do %l2
#define row2do %i2
! work place
#define work %l4
! pixel
#define pixel %l5
! difference value
#define diff %l6
! huffman code
#define huffCode %o0
!and size in bits
#define huffSize %o1
! huffman buffer
#define huffBits %l7
#define huffBitsFree %i5


	.section	".text",#alloc,#execinstr
	.align	8
	.skip	16

	! block 0

	.global	encodeScan
	.type	encodeScan,2
encodeScan:
init:	
	save	%sp,-104,%sp

	! here we start with initializing
	mov outP , outPsave
	!init huffman coder
	add 32 , %g0 , huffBitsFree
	! not forget to init huff bits ...
	! since new register sets are not always init to 0 ...
	mov %g0 , huffBits
startRow:	
	! init amount of pixels in the row
	! predictor for the first row is always 0 ,
	! and for the others we will init on the ond of the row
	
	! we are ready for the first pixel in the row ,
	! predictor for this is in the predFirst ( for the very first row , it's 0 )
	
firstPix:
	! load the very first pixel			
	ldub [pixPtr] , pixel
	! init predictor for this pixel
	add %g0 , 0x80 , pred
restartRow:	
	! setup predictor for the first pixel of the next row
	mov pixel , predFirst
	! setup amount of pixels to do in this row
	mov scanWidth , pix2do
	ba predict
	inc pixPtr
	
	! load the pixel in question
	ldub [pixPtr] , pixel
loadPix:	
	! and walk a step ...
	inc pixPtr
predict:
	! calculate difference value
	sub pixel , pred , diff
	! move used pixel to the next predictor
	mov pixel , pred
	! clamp difference value to 9 bits , since we use 8 bit pixel values
	and 0x1ff , diff , diff
	! and shift it 3 bits to left , to be able to use
	! this as table index
	sll diff , 3 , diff

	! now we can encode this difference as huffman code
	! load descriptor for this difference
	ldd [huffP + diff] , huffCode
	! reduce amount of free bits by actual size of coded symbol
	sub huffBitsFree , huffSize , huffBitsFree
	! shift code to left to fit the place
	sll huffCode , huffBitsFree , huffCode
	! and or this  ...
	or huffBits , huffCode , huffBits

	! ready to emit coded data
	! we do this always 16 bitwise
emitHuff:	
	cmp huffBitsFree , 16
	bg end_pixel
	! get 8 higher bits from ...
	srl huffBits , 24 , work
	! stuff 00 after 0xff
	cmp work , 0xff
	bne after_stuff
	stb work , [outP]
	inc outP
	stb %g0 , [outP]
	! and following 8 bits
after_stuff:	
	srl huffBits , 16 , work
	and work , 0xff , work
	cmp work , 0xff
	bne after_stuff2
	stb work , [outP + 1]
	stb %g0 , [outP + 2]
	inc outP
after_stuff2:	
	inc 2 , outP
	sll huffBits , 16 , huffBits
	inc 16 , huffBitsFree
	! we are ready with this pixel
end_pixel:
	! decrement pixel in row counter
	deccc pix2do
	bne loadPix
	! use delay slot to load pixel , if we do not take the branch
	! we are on the end of row , but we have to load first pixel of the nex row ,
	! haven't we ?
	ldub [pixPtr] , pixel
	deccc row2do
	bne restartRow
	! init predictor for this pixel
	mov predFirst , pred	
	
flush:
	! flush huffman coder
	cmp huffBitsFree , 24
	bg flush_last
	srl huffBits , 24 , work
	sll huffBits , 8 , huffBits
	stb work , [outP]
	inc outP
flush_last:
	! fake 0x1ff to be a code
	set 0x1ff , huffCode
	sub huffBitsFree , 9 , huffBitsFree
	sll huffCode , huffBitsFree , huffCode
	! and encode this
	or huffBits , huffCode , huffBits
	! and emit 8 resulting bits
	srl huffBits , 24 , work
	sll huffBits , 8 , huffBits
	stb work , [outP]
	! and ond of image marker ...
	or %g0 , 0xff , work
	stb work , [outP + 1]
	or %g0 , 0xd9 , work
	stb work , [outP + 2]
	inc 3 , outP	
	
	! return amount of bytes written so far
	sub outP , outPsave , %i0	
	jmp	%i7+8
	restore
	.size	encodeScan,(.-encodeScan)
	.align	8

	.file	"encodeScan.c"
	.xstabs	".stab.index","Xs ; V=3.1 ; R=SC4.0 18 Oct 1995 C 4.0",60,0,0,0
	.xstabs	".stab.index","/export/home0/kostik/source/compress; /opt/SUNWspro/SC4.0/bin/acc -Xs -YP,:/usr/ucblib:/opt/SUNWspro/SC4.0/bin/../lib:/opt/SUNWspro/SC4.0/bin:/usr/ccs/lib:/usr/lib -S -I/usr/ucbinclude  -c encodeScan.c -Qoption acomp -xp",52,0,0,0
	.ident	"@(#) encodeScan.s 1.2@(#) Copyright � by Konstantin Priblouda 1997 all rigths reserved"
	
```

Execution times went down to 38 / 28 ms (on micro / ultraspark  at 170 MHz) -  and suddently we had almost realtime conversion 
of video sequences.  After couple of years we moved to Silicon Graphics hardware ( pretty expesive,  but it had better video 
grabbing boards) - but no hardware support for loseless JPEG. So I had to port all the assenlby routunes to MIPS

See  [full source code on github](https://github.com/ko5tik/compress) 

Have fun
