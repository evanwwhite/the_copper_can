export const playerCombatArt = [
  "  o  ",
  " /│\\",
  " / \\",
];

// Walk cycle for the horizontally-scrolling scenes. The walk tick advances
// through every frame for the active facing while a direction key is held and
// falls back to frame 0 (feet together) when the player is standing still.
export const playerWalkFrames = {
  right: [
    [
      "  o  ",
      " /│\\ ",
      " / \\ ",
    ],
    [
      "  o  ",
      " /│\\ ",
      " / >  ",
    ],
    [
      "  o  ",
      " /│\\ ",
      "  |\\ ",
    ],
    [
      "  o  ",
      " /│\\ ",
      "  >\\ ",
    ],
  ],
  left: [
    [
      "  o  ",
      " /│\\ ",
      " / \\ ",
    ],
    [
      "  o  ",
      " /│\\ ",
      " < \\ ",
    ],
    [
      "  o  ",
      " /│\\ ",
      " / \\ ",
    ],
    [
      "  o  ",
      " /│\\ ",
      " /<\ ",
    ],
  ],
};

// Weapon pose swap: the can's current tool is always visible.
export const playerCombatPoses = {
  slingshot: [
  "  o  ",
  "Y/│\\ ",
  " / \\",
],

spear: [
  "  o    ",
  " ≤┼----",
  " / \\   "
],

  sword: [
    "│ o()",
    "┼/│' ",
    " / \\",
  ],
  heavySword: [
    "  o   ",
    "  │\-╪≈≈≈≈≈",
    " / \\ ",
  ],
  brace: [
    "  o()",
    " /│' ",
    " / \\",
  ],
};

export const boneRattleArt = [
  " ,_, ",
  "(** )",
  "/|=|\\",
  " | | ",
  "_/ \\_",
];

export const boneRattleDeadArt = [
  "  __o_,-.__",
  " x_x/ \\|\\_",
];

export const enemy1 = [
  "_o_",
  "/ | \\",
  "/ / \\\\",
];

export const darkTreeWatcherArt = [
  "<O^____",
  "  /|/| l.",
];

export const darkTreeWatcherDeadArt = [
  "<0^----,__",
];

export const chest = String.raw`
,-----,
|--o--|
|  ^  |
'-----'

/*
 {) 
_>#>
 / \

     __ 
   ,°_)
   "': 
⌐⌐--~: 
    ,  
   { { 
*/

/*
     ⌐/
    ⌐/ 
   ⌐/  
  ⌐/   
 ⌐/    
⌐/     
*/

/*
  ,",
 o ¡ 
/│V  
/ \  

`;

export const sword2 = String.raw`
│
╪
`.slice(1);

export const sword3 = String.raw`
│ 
│ 
╪]
`.slice(1);

export const sword4 = String.raw`
│
║
┼
`.slice(1);

export const sword5 = String.raw`
║
╬
I
`.slice(1);

export const sword6 = String.raw`

⌠
│
`.slice(1);

export const sword7 = String.raw`
│
0
┼
`.slice(1);

export const largeSword1 = String.raw`
-╪≈≈≈≈≈≈≈
`.slice(1);

export const shield1 = String.raw`
()
`.slice(1);

export const shield2 = String.raw`
__
)_)
`.slice(1);

export const shield3 = String.raw`
/-\
)0(
\-/
`.slice(1);

export const shield4 = String.raw`
¡╥¡
│╬│
!╨!
`.slice(1);

export const torch = String.raw`
. ) .
 ( ) .
  I
`.slice(1);

export const smallBow = String.raw`
│\
│/
`;

export const longBow = String.raw`
│\
│)
│/
`;

export const axe = String.raw`
<)
|
|
`;

export const shovel = String.raw`
┬
│
Ü
`;

export const reinforcedSpear = String.raw`
-]-------
`;


/* 
  ,  /\  .
 //`-||-'\\
(| -=||=- |)
 \\,-||-.//
  `  ||  '
     ||
     ||
     ||
     ||
     ||
hjm  ()


(>|
  |
  !

 /'-./\_
:    ||,>
 \.-'||
     ||
     ||
     ||   pjb

*/

/*
  ,,==.
 //    `
||      ,--~~~~-._ _(\--,_
 \\._,-~   \      '    *  `o
  `---~\( _/,___( /_/`---~~
        ``==-    `==-,
         Erik Andersson
*/

/*
          :
          :
          :
          :
   .__    :    __.
  /   \   :   /   \
 .____ \ _v_ / ____.
/     \ /^^^\ /     \
\      \\^^^//      /
  .-----X{"}X-----.
 /     /(o o)\     \
/     /  (")  \     \
\     \       /     /
       \     /
*/

/*
    ___ __
  _{___{__}\
 {_}      `\)
{_}        `            _.-''''--.._
{_}                    //'.--.  \___`.
 { }__,_.--~~~-~~~-~~-::.---. `-.\  `.)
  `-.{_{_{_{_{_{_{_{_//  -- 8;=- `
     `-:,_.:,_:,_:,.`\\._ ..'=- ,
         // // // //`-.`\`   .-'/
  jgs   << << << <<    \ `--'  /----)
         ^  ^  ^  ^     `-.....--'''
*/

/*
          /\ .---._
       /\/.-. /\ /\/\  br
     //\\oo //\\/\\\\
    //  /"/`---\\ \\"`-._
_.-'"           "`-.`-.
*/

/* 
        _____,    _..-=-=-=-=-====--,
     _.'a   /  .-',___,..=--=--==-'`
    ( _     \ /  //___/-=---=----'
     ` `\    /  //---/--==----=-'
  ,-.    | / \_//-_.'==-==---='
 (.-.`\  | |'../-'=-=-=-=--'
  (' `\`\| //_|-\.`;-~````~,        _
       \ | \_,_,_\.'        \     .'_`\
        `\            ,    , \    || `\\
          \    /   _.--\    \ '._.'/  / |
          /  /`---'   \ \   |`'---'   \/
         / /'          \ ;-. \
jgs   __/ /           __) \ ) `|
    ((='--;)         (,___/(,_/
*/

/* 
                        ______
             ______,---'__,---'
         _,-'---_---__,---'
  /_    (,  ---____',
 /  ',,   `, ,-'
;/)   ,',,_/,'
| /\   ,.'//\
`-` \ ,,'    `.
     `',   ,-- `.
     '/ / |      `,         _
     //'',.\_    .\\      ,{==>-
  __//   __;_`-  \ `;.__,;'
((,--,) (((,------;  `--' jv
```  '   ```
*/

/*
oo     
()\Ω_  
 \   ) 
  <~<"~

|\_/|
(o,o)
 ]_[ 

|\_/|       
(o o)~--,   
 '^'≤____≥.,
   / \ / \  

\ __O_ 
 ^  ║ >
   / \ 

\   _O_ 
 \ / ║ >
  ^  ║ '
   ,/ \,

\        
 \   _O_ 
  \ / ║ >
   ^  ║ '
      ║  
    ,/ \,

     ,-------.     
  ,-'         `-.  
 / ,-. ,---.   . \ 
( ( 0 (  0  )   ) )
 \ `-' `---'   ' / 
  `-. ~~~~~'  ,-'  
     `-------' 
     
 ,-. 
(oo )
 :-: 
(   )
 '-' 
 ,-. 
(oo )
 :-: 
(   )
 :-: 
(   )
 '-' 
 ,-. 
(oo )
 :-: 
(   )
 :-: 
(   )
 :-: 
(   )
 '-' 
 ,-. 
(oo )
 :-: 
(   )
 :-: 
(   )
 :-: 
(   )
 :-: 
(   )
 '-' 

       
oo/^\  
"╥--╥'~
   _   
oo/ \  
π╥--╥'~

  __ 
 {OO}
 (ô_)
,/ ,\

 ' )
 (',
(óó)
 '' 

  ,---.  
 /   0 \ 
[/\/\/  )
 \     / 
  '---'  

  {\  /}  
 / \\// \ 
( ( \/ ) )
 \ '--' / 
  '-┬┬-'  
 |\/||\/| 

 _~*
(_) 
' ' 

  ,~~*
 ,-.  
(ΘΘ ) 
<'-'> 

    ,~~~*
  ,---.  
 /     \ 
( Θ Θ   )
 \ -'  / 
,/'---;\ 

│\
│/


│\
│)
│/


│\
├/


│\
├)
│/


 o│\   o│\   o/\   o│\        
<├├)   ├┼)  <»─)» <├├)  ·· »──»
/ │/  / │/  / \/  / │/      

│
┼

│ 
│ 
╪]

│    ┬
║    │
┼    Ü

│
o
┼

 o__ 
/│)_)
/ \

\o/

()
__
)_)

¡╥¡
│╬│
!╨!

/-\
)0(
\-/

<)
|
|

 o
/│()
/ \

 │                           │
 ║ O¡╥¡      ô <) │ Φ__    Θ │    o│\   o
 ┼/││╬│    Y/│\|  ┼/│)_)  /║\╪]  <│├/  ≤┼---─
  / !╨!     / \    / \    / \     ≥≥   / \

    o 
    |\-╪≈≈≈≈≈≈≈
   / \

      │  │  ║     │
│  │  │  ║  ╬     0
┼  ╪  ╪] ┼  I  ⌠  ┼
               │   

-]-------
═╪════─  
-╪≈≈≈≈≈  

*/
